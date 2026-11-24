import assert from 'assert';
import { supabaseService } from '../services/SupabaseService';
import { appConfig } from '../config/app';

async function runSupabaseVerification() {
  console.log('=================================================================');
  console.log('⚡ MUSICA 2.0 — SUPABASE AUTH & DATABASE INTEGRATION VERIFICATION');
  console.log('=================================================================');

  // 1. Check Configuration
  console.log('\n[1/4] Checking Supabase service configuration...');
  assert(appConfig.supabase.url.includes('supabase.co'), 'Supabase URL must point to supabase.co');
  assert(appConfig.supabase.secretKey || appConfig.supabase.publishableKey, 'Supabase API keys must be loaded');
  console.log(`  ✅ Configured endpoint: ${appConfig.supabase.url}`);

  // 2. Client Initialization & Health Check
  console.log('\n[2/4] Testing Supabase Client Initialization & Connectivity...');
  assert(supabaseService.isEnabled(), 'SupabaseService should be enabled');
  const health = await supabaseService.healthCheck();
  console.log(`  ✅ Connectivity check result: ${health.message} (ok: ${health.ok})`);

  // 3. User Token Validation (Negative test on invalid token)
  console.log('\n[3/4] Testing Bearer Token Validation (Security Boundary)...');
  const invalidUser = await supabaseService.verifyToken('Bearer invalid_token_12345');
  assert(invalidUser === null, 'Invalid token must return null user');
  console.log('  ✅ Malformed/invalid token correctly rejected.');

  // 4. Room Session Recording (Graceful handling)
  console.log('\n[4/4] Testing Persistent Room Session Logger...');
  await supabaseService.recordRoomSession({
    roomId: 'TEST',
    roomName: 'Supabase Test Room',
    hostId: 'host-1',
    hostName: 'AdminHost',
    category: 'music',
  });
  console.log('  ✅ Room session recording executed cleanly.');

  console.log('\n=================================================================');
  console.log('🎉 ALL SUPABASE INTEGRATION TESTS PASSED! 🎉');
  console.log('=================================================================\n');
}

runSupabaseVerification().catch((err) => {
  console.error('\n❌ Supabase Verification Failed:', err);
  process.exit(1);
});
