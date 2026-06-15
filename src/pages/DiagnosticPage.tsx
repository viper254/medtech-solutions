import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      env: {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      },
      tests: {},
    };

    // Test 1: Check products table
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      diagnostics.tests.products = {
        success: !error,
        error: error?.message,
        recordCount: data?.length || 0,
      };
    } catch (e: any) {
      diagnostics.tests.products = {
        success: false,
        error: e.message,
      };
    }

    // Test 2: Check site_control table
    try {
      const { data, error } = await supabase
        .from('site_control')
        .select('*')
        .limit(1);
      
      diagnostics.tests.site_control = {
        success: !error,
        error: error?.message,
        data: data,
      };
    } catch (e: any) {
      diagnostics.tests.site_control = {
        success: false,
        error: e.message,
      };
    }

    // Test 3: Check get_site_status function
    try {
      const { data, error } = await supabase.rpc('get_site_status');
      
      diagnostics.tests.get_site_status = {
        success: !error,
        error: error?.message,
        data: data,
      };
    } catch (e: any) {
      diagnostics.tests.get_site_status = {
        success: false,
        error: e.message,
      };
    }

    setResults(diagnostics);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Running Diagnostics...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', backgroundColor: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#0f0' }}>🔍 Database Connection Diagnostics</h1>
      
      <h2 style={{ color: '#ff0', marginTop: '2rem' }}>Environment Variables</h2>
      <pre style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(results.env, null, 2)}
      </pre>

      <h2 style={{ color: '#ff0', marginTop: '2rem' }}>Connection Tests</h2>
      {Object.entries(results.tests).map(([name, result]: [string, any]) => (
        <div key={name} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: result.success ? '#0f0' : '#f00' }}>
            {result.success ? '✅' : '❌'} {name}
          </h3>
          <pre style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ))}

      <button 
        onClick={runDiagnostics}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#0f0',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        🔄 Run Again
      </button>
    </div>
  );
}
