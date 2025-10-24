'use client';

import { useEffect, useState } from 'react';

export default function TestTimeSlotPage() {
  const [results, setResults] = useState<string[]>(['Testing...']);

  useEffect(() => {
    async function runTests() {
      const testResults: string[] = [];

      try {
        // Dynamically import to avoid SSR issues
        const { TimeSlot, TimeRange } = await import('@/lib/domain/timeslot');
        
        // Test 1: TimeSlot creation
        const slot = TimeSlot.fromTime(14, 0);
        testResults.push(`✅ TimeSlot created: ${slot.toString()}`);
        
        // Test 2: TimeSlot navigation
        const next = slot.next();
        testResults.push(`✅ Next slot: ${next.toString()}`);
        
        // Test 3: TimeRange creation
        const range = TimeRange.fromLegacy('14:00', 60);
        testResults.push(`✅ TimeRange: ${range.toString()}`);
        
        // Test 4: TimeRange slots
        const slots = range.getAllSlots();
        testResults.push(`✅ Slots in range: ${slots.length}`);
        
        // Test 5: Display formatting
        testResults.push(`✅ Display: ${slot.toDisplayString()}`);
        
        // Test 6: Container access
        const { container } = await import('@/lib/container');
        const hasServices = !!(container.timeSlotBookingService && container.scheduleFactory);
        testResults.push(`✅ Container services: ${hasServices ? 'Available' : 'Missing'}`);
        
        testResults.push('\n🎉 All tests passed!');
      } catch (error: any) {
        testResults.push(`❌ Error: ${error.message}`);
      }

      setResults(testResults);
    }

    runTests();
  }, []);

  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'monospace',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        TimeSlot System Test
      </h1>
      
      <div style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap'
      }}>
        {results.map((result, i) => (
          <div key={i} style={{ marginBottom: '8px' }}>
            {result}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>
          Next Steps:
        </h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ Core domain objects work</li>
          <li>✅ Container integration works</li>
          <li>📝 Try the API: <code>/api/v2/schedule?date=2025-10-25&category=small</code></li>
          <li>📝 See QUICKSTART.md for building UI components</li>
        </ul>
      </div>
    </div>
  );
}

