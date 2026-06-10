import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Accueil',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/dashboard',
  },
  {
    navCap: 'Gestion Candidats',
  },
  {
    displayName: 'Utilisateurs',
    iconName: 'users',
    route: '/users',
  },
  {
    displayName: 'Demandes',
    iconName: 'file-description',
    route: '/demandes',
  },
  {
    displayName: 'Bookings',
    iconName: 'calendar',
    route: '/bookings',
  },
  {
    displayName: 'Orders',
    iconName: 'wallet',
    route: '/orders',
  },
  {
    navCap: 'Référentiel',
  },
  {
    displayName: 'Pays',
    iconName: 'globe',
    route: '/countries',
  },
];