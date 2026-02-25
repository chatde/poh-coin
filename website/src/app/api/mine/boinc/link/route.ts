import { NextRequest, NextResponse } from 'next/server';
import { validateCPID, fetchBOINCData } from '@/lib/boinc-data';

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

    // Store the link (in-memory for now, will use Supabase later)
    // This is a placeholder - actual implementation will write to database
    const linkData = {
      walletAddress: walletAddress.toLowerCase(),
      cpid: trimmedCpid,
      data: boincData,
      linkedAt: new Date().toISOString()
    };

    // TODO: When Supabase migration is run, replace this with:
    // await supabase.from('boinc_links').upsert({
    //   wallet_address: walletAddress.toLowerCase(),
    //   cpid: trimmedCpid,
    //   projects: boincData.projects,
    //   total_credit: boincData.totalCredit,
    //   last_synced_at: boincData.lastSynced.toISOString(),
    //   verified: true
    // });

    console.log('BOINC link created:', linkData);

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
