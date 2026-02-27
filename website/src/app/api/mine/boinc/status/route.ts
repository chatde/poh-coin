import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    const { data, error } = await supabase
      .from('boinc_links')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .single();

    if (error || !data) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      data: {
        cpid: data.cpid,
        projects: data.projects,
        totalCredit: data.total_credit,
        lastSynced: data.last_synced_at
      }
    });

  } catch (error) {
    console.error('BOINC status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
