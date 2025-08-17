import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Fetches the markup percentage for a given airline and route from Firestore.
 * @param airlineCode - 2-letter airline code
 * @param fromAirport - 3-letter origin airport code
 * @param toAirport - 3-letter destination airport code
 * @returns markup percentage (number) or 0 if not found
 */
export async function getMarkup(airlineCode: string, fromAirport: string, toAirport: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'markups'),
      where('airlineCode', '==', airlineCode),
      where('fromAirport', '==', fromAirport),
      where('toAirport', '==', toAirport)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return typeof data.markup === 'number' ? data.markup : 0;
    }
    return 0;
  } catch (err) {
    console.error('Error fetching markup from Firestore:', err);
    return 0;
  }
}

// Alias for backward compatibility
export const getMarkupByAirline = getMarkupByAirlineAndRoute;

/**
 * Fetches the markup percentage for a given airline, role, and optionally route from Firestore.
 * Tries to find route-specific markup first, then falls back to airline+role only.
 * @param airlineCode - 2-letter airline code
 * @param role - user role (e.g., 'USER', 'AGENT'). Defaults to 'USER'.
 * @param fromAirport - 3-letter origin airport code (optional)
 * @param toAirport - 3-letter destination airport code (optional)
 * @returns markup percentage (number) or 0 if not found
 */
export async function getMarkupByAirlineAndRoute(
  airlineCode: string,
  role: string = 'USER',
  fromAirport?: string,
  toAirport?: string
): Promise<number> {
  try {
    // 1. Try to find route-specific markup
    if (fromAirport && toAirport) {
      const q1 = query(
        collection(db, 'markups'),
        where('airlineCode', '==', airlineCode),
        where('role', '==', role),
        where('fromAirport', '==', fromAirport),
        where('toAirport', '==', toAirport)
      );
      const snapshot1 = await getDocs(q1);
      if (!snapshot1.empty) {
        const data = snapshot1.docs[0].data();
        return typeof data.markup === 'number' ? data.markup : 0;
      }
    }
    // 2. Fallback to airline+role only (fromAirport/toAirport as empty string)
    const q2 = query(
      collection(db, 'markups'),
      where('airlineCode', '==', airlineCode),
      where('role', '==', role),
      where('fromAirport', 'in', ['', null]),
      where('toAirport', 'in', ['', null])
    );
    const snapshot2 = await getDocs(q2);
    if (!snapshot2.empty) {
      const data = snapshot2.docs[0].data();
      return typeof data.markup === 'number' ? data.markup : 0;
    }
    return 0;
  } catch (err) {
    console.error('Error fetching markup from Firestore:', err);
    return 0;
  }
} 