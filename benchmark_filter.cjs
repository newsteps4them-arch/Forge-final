const { performance } = require('perf_hooks');

// Generate mock data
const NUM_DOCS = 10000;
const docs = [];
for (let i = 0; i < NUM_DOCS; i++) {
  docs.push({
    id: i,
    type: i % 3 === 0 ? "Recall" : i % 2 === 0 ? "TSB" : "Service",
    title: `Document ${i} - ${i % 2 === 0 ? "Engine Misfire" : "Transmission Fluid"}`,
    date: `202${i % 4}-0${(i % 9) + 1}-10`,
    relevance: i % 4 === 0 ? "Critical" : "Routine"
  });
}

const search = "engine";

function benchmarkBaseline(iterations) {
  let result = null;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Current implementation inline filtering
    result = docs.filter(d =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
    );
  }
  const end = performance.now();
  return { time: end - start, resultLength: result.length };
}

function benchmarkOptimized(iterations) {
  let result = null;
  const start = performance.now();

  // Simulated useMemo block - computed once when search/docs changes
  const searchLower = search.toLowerCase();
  const memoizedFiltered = docs.filter(d =>
    d.title.toLowerCase().includes(searchLower) ||
    d.type.toLowerCase().includes(searchLower)
  );

  for (let i = 0; i < iterations; i++) {
    // Component render just uses the pre-computed array
    result = memoizedFiltered;
  }
  const end = performance.now();
  return { time: end - start, resultLength: result.length };
}

const iterations = 1000; // Simulate 1000 re-renders

console.log(`Running benchmark with ${NUM_DOCS} docs for ${iterations} render iterations...`);

const baselineResult = benchmarkBaseline(iterations);
console.log(`Baseline (Inline Filter): ${baselineResult.time.toFixed(2)} ms (Matched: ${baselineResult.resultLength})`);

const optimizedResult = benchmarkOptimized(iterations);
console.log(`Optimized (useMemo): ${optimizedResult.time.toFixed(2)} ms (Matched: ${optimizedResult.resultLength})`);

const improvement = baselineResult.time / optimizedResult.time;
console.log(`Improvement: ${improvement.toFixed(2)}x faster`);
