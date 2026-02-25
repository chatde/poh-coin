import { NextRequest, NextResponse } from 'next/server';
import type { BOINCData } from '@/lib/boinc-data';

// In-memory storage for BOINC links (temporary until Supabase table is created)
interface BOINCLink {
  walletAddress: string;
  cpid: string;
  data: BOINCData;
  linkedAt: string;
}

// This will be replaced with Supabase query after migration
const boincLinks = new Map<string, BOINCLink>();

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

    // TODO: When Supabase migration is run, replace this with:
    // const { data, error } = await supabase
    //   .from('boinc_links')
    //   .select('*')
    //   .eq('wallet_address', normalizedAddress)
    //   .single();
    //
    // if (error || !data) {
    //   return NextResponse.json({ linked: false });
    // }
    //
    // return NextResponse.json({
    //   linked: true,
    //   data: {
    //     cpid: data.cpid,
    //     projects: data.projects,
    //     totalCredit: data.total_credit,
    //     lastSynced: data.last_synced_at
    //   }
    // });

    // Temporary in-memory lookup
    const link = boincLinks.get(normalizedAddress);

    if (!link) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      data: link.data
    });

  } catch (error) {
    console.error('BOINC status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the in-memory store for use by the link route
// This is a temporary solution until database is set up
export function storeBOINCLink(link: BOINCLink): void {
  boincLinks.set(link.walletAddress.toLowerCase(), link);
}

export function getBOINCLink(walletAddress: string): BOINCLink | undefined {
  return boincLinks.get(walletAddress.toLowerCase());
}
