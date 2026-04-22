from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from math import sqrt
from random import Random
from typing import Any, Dict, List, Optional, Sequence, Tuple


def _is_numeric(value: Any) -> bool:
    return isinstance(value, (int, float))


def _mean(values: Sequence[float]) -> float:
    return sum(values) / len(values)


def _variance(values: Sequence[float]) -> float:
    mean_value = _mean(values)
    return sum((value - mean_value) ** 2 for value in values) / len(values)


def _gini(values: Sequence[Any]) -> float:
    counts = Counter(values)
    total = len(values)
    return 1.0 - sum((count / total) ** 2 for count in counts.values())


@dataclass
class TreeNode:
    prediction: Any
    feature_name: Optional[str] = None
    threshold: Optional[float] = None
    category: Optional[Any] = None
    is_numeric: bool = True
    left: Optional["TreeNode"] = None
    right: Optional["TreeNode"] = None


class _BaseDecisionTree:
    def __init__(
        self,
        *,
        max_depth: int,
        min_samples_split: int,
        min_samples_leaf: int,
        max_features: int,
        seed: int,
    ) -> None:
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_features = max_features
        self.rng = Random(seed)
        self.root: Optional[TreeNode] = None
        self.feature_names: List[str] = []

    def fit(self, X: List[Dict[str, Any]], y: List[Any]) -> None:
        self.feature_names = list(X[0].keys()) if X else []
        self.root = self._build_tree(X, y, depth=0)

    def predict(self, X: List[Dict[str, Any]]) -> List[Any]:
        return [self._predict_row(row, self.root) for row in X]

    def _predict_row(self, row: Dict[str, Any], node: Optional[TreeNode]) -> Any:
        if node is None or node.feature_name is None:
            return node.prediction if node else None

        value = row.get(node.feature_name)
        if node.is_numeric:
            branch = node.left if float(value) <= float(node.threshold) else node.right
        else:
            branch = node.left if value == node.category else node.right
        return self._predict_row(row, branch or node)

    def _build_tree(self, X: List[Dict[str, Any]], y: List[Any], depth: int) -> TreeNode:
        prediction = self._leaf_prediction(y)
        node = TreeNode(prediction=prediction)

        if (
            depth >= self.max_depth
            or len(X) < self.min_samples_split
            or self._should_stop(y)
            or not self.feature_names
        ):
            return node

        split = self._best_split(X, y)
        if split is None:
            return node

        feature_name, threshold, category, is_numeric, left_indices, right_indices = split
        left_X = [X[index] for index in left_indices]
        left_y = [y[index] for index in left_indices]
        right_X = [X[index] for index in right_indices]
        right_y = [y[index] for index in right_indices]

        node.feature_name = feature_name
        node.threshold = threshold
        node.category = category
        node.is_numeric = is_numeric
        node.left = self._build_tree(left_X, left_y, depth + 1)
        node.right = self._build_tree(right_X, right_y, depth + 1)
        return node

    def _best_split(
        self,
        X: List[Dict[str, Any]],
        y: List[Any],
    ) -> Optional[Tuple[str, Optional[float], Optional[Any], bool, List[int], List[int]]]:
        parent_impurity = self._impurity(y)
        best_gain = 0.0
        best_split = None
        feature_candidates = self.feature_names[:]
        self.rng.shuffle(feature_candidates)
        feature_candidates = feature_candidates[: self.max_features]

        for feature_name in feature_candidates:
            values = [row[feature_name] for row in X]
            if not values:
                continue

            if _is_numeric(values[0]):
                unique_values = sorted({float(value) for value in values})
                if len(unique_values) < 2:
                    continue
                thresholds = [
                    (unique_values[index] + unique_values[index + 1]) / 2.0
                    for index in range(len(unique_values) - 1)
                ]
                if len(thresholds) > 12:
                    step = max(1, len(thresholds) // 12)
                    thresholds = thresholds[::step]

                for threshold in thresholds:
                    left_indices = [index for index, value in enumerate(values) if float(value) <= threshold]
                    right_indices = [index for index, value in enumerate(values) if float(value) > threshold]
                    if not self._valid_split(left_indices, right_indices):
                        continue
                    gain = parent_impurity - self._split_impurity(y, left_indices, right_indices)
                    if gain > best_gain:
                        best_gain = gain
                        best_split = (feature_name, threshold, None, True, left_indices, right_indices)
            else:
                categories = list(dict.fromkeys(values))
                for category in categories[:12]:
                    left_indices = [index for index, value in enumerate(values) if value == category]
                    right_indices = [index for index, value in enumerate(values) if value != category]
                    if not self._valid_split(left_indices, right_indices):
                        continue
                    gain = parent_impurity - self._split_impurity(y, left_indices, right_indices)
                    if gain > best_gain:
                        best_gain = gain
                        best_split = (feature_name, None, category, False, left_indices, right_indices)

        return best_split

    def _valid_split(self, left_indices: List[int], right_indices: List[int]) -> bool:
        return (
            len(left_indices) >= self.min_samples_leaf
            and len(right_indices) >= self.min_samples_leaf
        )

    def _split_impurity(self, y: List[Any], left_indices: List[int], right_indices: List[int]) -> float:
        left_y = [y[index] for index in left_indices]
        right_y = [y[index] for index in right_indices]
        total = len(y)
        return (len(left_y) / total) * self._impurity(left_y) + (len(right_y) / total) * self._impurity(right_y)

    def _impurity(self, y: Sequence[Any]) -> float:
        raise NotImplementedError

    def _leaf_prediction(self, y: Sequence[Any]) -> Any:
        raise NotImplementedError

    def _should_stop(self, y: Sequence[Any]) -> bool:
        raise NotImplementedError


class _RegressionTree(_BaseDecisionTree):
    def _impurity(self, y: Sequence[Any]) -> float:
        values = [float(value) for value in y]
        return _variance(values)

    def _leaf_prediction(self, y: Sequence[Any]) -> Any:
        values = [float(value) for value in y]
        return _mean(values)

    def _should_stop(self, y: Sequence[Any]) -> bool:
        values = [float(value) for value in y]
        return len(values) == 0 or _variance(values) < 1e-9


class _ClassificationTree(_BaseDecisionTree):
    def _impurity(self, y: Sequence[Any]) -> float:
        return _gini(y)

    def _leaf_prediction(self, y: Sequence[Any]) -> Any:
        return Counter(y).most_common(1)[0][0]

    def _should_stop(self, y: Sequence[Any]) -> bool:
        return len(set(y)) <= 1


class _BaseRandomForest:
    def __init__(
        self,
        *,
        n_estimators: int = 40,
        max_depth: int = 6,
        min_samples_split: int = 6,
        min_samples_leaf: int = 2,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.random_state = random_state
        self.trees: List[_BaseDecisionTree] = []

    def fit(self, X: List[Dict[str, Any]], y: List[Any]) -> None:
        if not X:
            self.trees = []
            return

        rng = Random(self.random_state)
        feature_count = len(X[0])
        max_features = max(1, int(sqrt(feature_count)))
        self.trees = []

        for index in range(self.n_estimators):
            sample_X, sample_y = self._bootstrap_sample(X, y, rng)
            tree = self._tree_factory(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                min_samples_leaf=self.min_samples_leaf,
                max_features=max_features,
                seed=rng.randint(0, 10_000_000) + index,
            )
            tree.fit(sample_X, sample_y)
            self.trees.append(tree)

    def predict(self, X: List[Dict[str, Any]]) -> List[Any]:
        if not self.trees:
            return []
        predictions = [tree.predict(X) for tree in self.trees]
        return [self._aggregate([tree_predictions[row_index] for tree_predictions in predictions]) for row_index in range(len(X))]

    def _bootstrap_sample(
        self,
        X: List[Dict[str, Any]],
        y: List[Any],
        rng: Random,
    ) -> Tuple[List[Dict[str, Any]], List[Any]]:
        sample_X: List[Dict[str, Any]] = []
        sample_y: List[Any] = []
        for _ in range(len(X)):
            sample_index = rng.randrange(len(X))
            sample_X.append(X[sample_index])
            sample_y.append(y[sample_index])
        return sample_X, sample_y

    def _tree_factory(self, **kwargs: Any) -> _BaseDecisionTree:
        raise NotImplementedError

    def _aggregate(self, predictions: List[Any]) -> Any:
        raise NotImplementedError


class RandomForestRegressor(_BaseRandomForest):
    def _tree_factory(self, **kwargs: Any) -> _BaseDecisionTree:
        return _RegressionTree(**kwargs)

    def _aggregate(self, predictions: List[Any]) -> Any:
        return _mean([float(value) for value in predictions])


class RandomForestClassifier(_BaseRandomForest):
    def _tree_factory(self, **kwargs: Any) -> _BaseDecisionTree:
        return _ClassificationTree(**kwargs)

    def _aggregate(self, predictions: List[Any]) -> Any:
        return Counter(predictions).most_common(1)[0][0]
