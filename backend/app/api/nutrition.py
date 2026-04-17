from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()

@router.get("/search")
async def search_food(
    query: str,
    current_user: User = Depends(get_current_user),
):
    """Search food from USDA + Open Food Facts"""
    results = []

    # USDA FoodData Central
    if settings.USDA_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=8.0) as http:
                resp = await http.get(
                    "https://api.nal.usda.gov/fdc/v1/foods/search",
                    params={"query": query, "pageSize": 10, "api_key": settings.USDA_API_KEY},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("foods", []):
                        nutrients = {n["nutrientName"]: n.get("value", 0) for n in item.get("foodNutrients", [])}
                        results.append({
                            "source": "USDA",
                            "name": item["description"],
                            "brand": item.get("brandOwner", ""),
                            "calories_per_100g": nutrients.get("Energy", 0),
                            "protein_per_100g": nutrients.get("Protein", 0),
                            "carbs_per_100g": nutrients.get("Carbohydrate, by difference", 0),
                            "fat_per_100g": nutrients.get("Total lipid (fat)", 0),
                        })
        except Exception:
            pass

    # Open Food Facts (no API key needed)
    try:
        async with httpx.AsyncClient(timeout=8.0) as http:
            resp = await http.get(
                f"https://world.openfoodfacts.org/cgi/search.pl",
                params={
                    "search_terms": query,
                    "json": 1,
                    "page_size": 5,
                    "fields": "product_name,brands,nutriments",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("products", []):
                    nutriments = item.get("nutriments", {})
                    if item.get("product_name"):
                        results.append({
                            "source": "OpenFoodFacts",
                            "name": item["product_name"],
                            "brand": item.get("brands", ""),
                            "calories_per_100g": nutriments.get("energy-kcal_100g", 0),
                            "protein_per_100g": nutriments.get("proteins_100g", 0),
                            "carbs_per_100g": nutriments.get("carbohydrates_100g", 0),
                            "fat_per_100g": nutriments.get("fat_100g", 0),
                        })
    except Exception:
        pass

    return {"query": query, "results": results[:15]}
