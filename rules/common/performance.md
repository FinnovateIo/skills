# Performance

## Guiding Principle

Readability first, performance where it matters.

- If significantly more readable code costs a negligible amount of performance, choose readability.
- Optimize when there is a measured problem, a known scale requirement, or an obviously wrong complexity class.
- Measure before and after. An optimization without a benchmark is a guess.

---

## Algorithmic Complexity

Know the cost of the operations you reach for:

| Operation               | Complexity |
| ----------------------- | ---------- |
| Hash map / set lookup   | O(1)       |
| Binary search on sorted | O(log n)   |
| Scan of unsorted list   | O(n)       |
| Nested scan over a list | O(n²)      |
| Sort                    | O(n log n) |

- Replace nested lookups over collections with a hash map or set built once up front.
- Watch for accidental quadratic work: a lookup inside a loop over the same collection.
- Choose the data structure that matches the access pattern, not the one that is easiest to type.

---

## Memory Trade-offs

There is almost always a trade-off between speed and memory.

- A hash map is fast but holds more memory than a list. Pay that cost deliberately.
- Do not hold entire datasets in memory when a bounded slice will do.
- Release references to large objects once they are no longer needed.
- Prefer bounded caches and buffers over unbounded ones.

---

## Caching

Cache data that is expensive to compute or fetch and frequently read.

- Cache the result, not the request path, when the computation is deterministic.
- Always define an invalidation strategy before adding a cache. A cache without invalidation is a bug with a delay.
- Set explicit TTLs and size limits.
- Do not cache user-specific data in a shared cache without scoping it by user.

---

## Data Access

- **Never call a database or external API inside a loop or a recursive function.** This is the single most common source of severe performance failures.
- Use bulk operations (batch insert, batch update, batch fetch) instead of per-item calls.
- Fetch related data in a single query or a batched lookup rather than one query per record (N+1 problem).
- Paginate every endpoint or query that can return an unbounded result set.
- Only select the fields you actually use.
- Ensure queries filter, sort, and join on indexed fields. Joining or filtering on non-indexed properties will not scale.
- Run independent queries and requests concurrently instead of sequentially.

---

## I/O and Large Payloads

- Read and write files in chunks or streams. Avoid loading an entire file into memory.
- Stream large responses to the client instead of buffering them.
- Avoid passing binary data through your application layer. Prefer direct client-to-storage transfers with scoped, expiring credentials.
- Apply size limits on uploads and request bodies.

---

## Concurrency and Offloading

- Keep request handlers short. Delegate expensive work to the data store, a background worker, or a queue.
- Long-running, retryable, or bursty work belongs in a job queue, not in a request/response cycle.
- Be aware of the concurrency model of the runtime you are on, and avoid blocking whatever handles incoming work.
- Apply backpressure or rate limiting so a burst of traffic degrades gracefully rather than collapsing.

---

## Designing for Scale

Write code with scale in mind:

- Will this hold up at 100x the current data volume or user count?
- Can it be scaled horizontally, or does it depend on state living in a single process?
- Keep application instances stateless. Push shared state to a database, cache, or queue.
- Prefer idempotent operations so work can be safely retried.
- Ask what happens on failure, retry, and duplicate delivery before shipping.

---

## Performance Checklist

Before marking work complete:

- [ ] No database or external API calls inside loops or recursion
- [ ] Bulk operations used where multiple records are touched
- [ ] Unbounded queries and endpoints are paginated
- [ ] Queries filter, sort, and join on indexed fields
- [ ] Independent asynchronous work runs concurrently, not sequentially
- [ ] Large files and payloads are streamed, not buffered in memory
- [ ] Expensive, frequently read data is cached with a defined invalidation strategy
- [ ] No accidental quadratic complexity in hot paths
- [ ] Expensive work is offloaded from the request cycle
- [ ] The code remains readable; any complex optimization is justified by a measurement
