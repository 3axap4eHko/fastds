import { Benchmark, printTableReports } from 'overtake';

const runner = Benchmark.create('test', () => Array.from({ length: 1000000 }, (_, idx) => idx));
const ringTarget = runner.target('ring', async () => {
  const { RingBuffer } = await import(process.cwd() + '/build/ring-buffer.js');
  const ring = new RingBuffer();
  return { ring, RingBuffer };
});
const reports = await runner.execute({ reportTypes: ['ops'] });
printTableReports(reports);
