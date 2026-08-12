---
paths:
  - '**/*.py'
  - '**/*.pyi'
---

# Python Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with Python specific content.

## Standards

- Follow **PEP 8** conventions
- Use **type annotations** on all function signatures

## Naming

Overrides the `camelCase` convention in [common/coding-style.md](../common/coding-style.md).

- Variables, functions, methods, modules, and packages: `snake_case`
- Classes, exceptions, type aliases, and `TypeVar`s: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Internal, non-public names: single leading underscore (`_parse_row`)

The rest of the naming guidance in [common/coding-style.md](../common/coding-style.md) still applies — descriptive nouns for variables, verb-led names for functions, `is`/`has`/`should`/`can` prefixes for booleans, and no unclear abbreviations.

## EAFP — Easier to Ask Forgiveness Than Permission

Python prefers exception handling over checking conditions up front.

```python
# Good: EAFP style
def get_value(dictionary: dict, key: str, default_value: Any = None) -> Any:
    try:
        return dictionary[key]
    except KeyError:
        return default_value

# Bad: LBYL (Look Before You Leap) style
def get_value(dictionary: dict, key: str, default_value: Any = None) -> Any:
    if key in dictionary:
        return dictionary[key]
    else:
        return default_value
```

## Type Hints

Always add types to code

### Basic Type Annotations

```python
from typing import Any

def process_user(
    user_id: str,
    data: dict[str, Any],
    active: bool = True
) -> User | None:
    """Process a user and return the updated User or None."""
    if not active:
        return None
    return User(user_id, data)
```

### Prefer Built-in Generics

Use built-in collection types (Python 3.9+) and `X | None` (Python 3.10+) rather than the
`typing` equivalents. Reach for `typing.List` / `typing.Dict` / `typing.Optional` only when
the project must support an older interpreter.

```python
# Good: Python 3.9+
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Only for Python 3.8 and earlier
from typing import List, Dict

def process_items(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}
```

### Type Aliases and TypeVar

```python
from typing import TypeVar, Union

# Type alias for complex types
JSON = Union[dict[str, Any], list[Any], str, int, float, bool, None]

def parse_json(data: str) -> JSON:
    return json.loads(data)

# Generic types
T = TypeVar('T')

def first(items: list[T]) -> T | None:
    """Return the first item or None if list is empty."""
    return items[0] if items else None
```

## Context Managers

Use `with` for anything that must be released — files, sockets, locks, connections.

```python
# Good: Using context managers
def process_file(path: str) -> str:
    with open(path, 'r') as f:
        return f.read()

# Bad: Manual resource management
def process_file(path: str) -> str:
    f = open(path, 'r')
    try:
        return f.read()
    finally:
        f.close()
```

## Comprehensions and Generators

### List Comprehensions

```python
# Good: List comprehension for simple transformations
names = [user.name for user in users if user.is_active]

# Bad: Manual loop
names = []
for user in users:
    if user.is_active:
        names.append(user.name)
```

Once a comprehension stacks multiple conditions or nested loops, give it a name instead:

```python
# Bad: Too complex to read inline
result = [x * 2 for x in items if x > 0 if x % 2 == 0]

# Good: Name the intent with a generator function
def positive_evens_doubled(items: Iterable[int]) -> Iterator[int]:
    for x in items:
        if x > 0 and x % 2 == 0:
            yield x * 2
```

### Generator Expressions

Use a generator expression when the result is consumed once and never needs to exist as a list.

```python
# Good: Generator for lazy evaluation
total = sum(x * x for x in range(1_000_000))

# Bad: Creates large intermediate list
total = sum([x * x for x in range(1_000_000)])
```

## Error Handling

See [error-handling.md](./error-handling.md) for how to handle errors in Python.

## Anti-Patterns to Avoid

```python
# Bad: Mutable default arguments
def append_to(item, items=[]):
    items.append(item)
    return items

# Good: Use None and create new list
def append_to(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

# Bad: Checking type with type()
if type(obj) == list:
    process(obj)

# Good: Use isinstance
if isinstance(obj, list):
    process(obj)

# Bad: Comparing to None with ==
if value == None:
    process()

# Good: Use is
if value is None:
    process()

# Bad: from module import *
from os.path import *

# Good: Explicit imports
from os.path import join, exists
```
