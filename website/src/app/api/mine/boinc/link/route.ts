import { NextRequest, NextResponse } from 'next/server';
import { validateCPID, fetchBOINCData } from '@/lib/boinc-data';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, cpid } = body;

    // Validate inputs
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }

    if (!cpid || typeof cpid !== 'string') {
      return NextResponse.json(
        { error: 'CPID is required' },
        { status: 400 }
      );
    }

    // Validate CPID format
    const trimmedCpid = cpid.trim();
    if (!validateCPID(trimmedCpid)) {
      return NextResponse.json(
        { error: 'Invalid CPID format. Must be 32 hexadecimal characters.' },
        { status: 400 }
      );
    }

    // Fetch and verify BOINC data
    let boincData;
    try {
      boincData = await fetchBOINCData(trimmedCpid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify BOINC account';
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    // Store the link in Supabase
    const { error: upsertError } = await supabase.from('boinc_links').upsert({
      wallet_address: walletAddress.toLowerCase(),
      cpid: trimmedCpid,
      projects: boincData.projects,
      total_credit: boincData.totalCredit,
      last_synced_at: boincData.lastSynced.toISOString(),
      verified: true
    }, { onConflict: 'wallet_address' });

    if (upsertError) {
      console.error('BOINC link upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save BOINC link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: boincData
    });

  } catch (error) {
    console.error('BOINC link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
