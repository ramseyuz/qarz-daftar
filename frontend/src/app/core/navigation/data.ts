import {FuseNavigationItem} from '../../../@fuse/components/navigation';
import {Navigation} from './navigation.types';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id   : 'dashboard',
        title: 'Dashboard',
        type : 'basic',
        icon : 'heroicons_outline:chart-bar',
        link : '/dashboard',
    },
    {
        id   : 'businesses',
        title: 'Businesses',
        type : 'basic',
        icon : 'heroicons_outline:building-storefront',
        link : '/businesses',
    },
    {
        id   : 'users',
        title: 'Users',
        type : 'basic',
        icon : 'heroicons_outline:users',
        link : '/users',
    },
    {
        id   : 'customers',
        title: 'Customers',
        type : 'basic',
        icon : 'heroicons_outline:user-group',
        link : '/customers',
    },
    {
        id      : 'finance',
        title   : 'Finance',
        type    : 'group',
        icon    : 'heroicons_outline:banknotes',
        children: [
            {
                id   : 'debts',
                title: 'Debts',
                type : 'basic',
                icon : 'heroicons_outline:document-text',
                link : '/debts',
            },
            {
                id   : 'payments',
                title: 'Payments',
                type : 'basic',
                icon : 'heroicons_outline:credit-card',
                link : '/payments',
            },
        ],
    },
    {
        id      : 'subscription-group',
        title   : 'Subscriptions',
        type    : 'group',
        icon    : 'heroicons_outline:star',
        children: [
            {
                id   : 'subscription-plans',
                title: 'Plans',
                type : 'basic',
                icon : 'heroicons_outline:squares-2x2',
                link : '/subscription-plans',
            },
            {
                id   : 'subscriptions',
                title: 'Subscriptions',
                type : 'basic',
                icon : 'heroicons_outline:calendar-days',
                link : '/subscriptions',
            },
        ],
    },
];

export const navigation: Navigation = {
    default: defaultNavigation,
};
