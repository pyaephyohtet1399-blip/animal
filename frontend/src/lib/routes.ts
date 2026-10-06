/**
 * Route helpers shared by the navigation and breadcrumb components.
 *
 * Kept out of `config/navigation.ts` so that config stays declarative.
 */

/**
 * Whether a navigation entry should be highlighted for the current pathname.
 *
 * Nested routes keep their parent entry active, so
 * `/explorer/township/TSP001` still highlights "Data Explorer".
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
