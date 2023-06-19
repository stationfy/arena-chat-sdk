import React from 'react';
import styles from './styles.module.css';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import ArenaLogo from '@site/static/img/arena-logo.svg';

const actions = [
  {
    label: 'Privacy Policy',
    link: 'https://arena.im/privacy-policy',
  },
  {
    label: 'Terms of Service',
    link: 'https://arena.im/terms-of-service',
  },
  {
    label: 'GDPR Compliance',
    link: 'https://arena.im/gdpr-compliance',
  },
];

export default function Footer(): JSX.Element {
  return (
    <section className={styles.footer}>
      <div className={clsx('container', styles.row)}>
        <div className={styles.copy}>© 2020 Arena.im</div>

        <div className={styles.actions}>
          {actions.map((action) => (
            <Link key={action.label} to={action.link}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <Link to="https://arena.im">
        <ArenaLogo />
      </Link>
    </section>
  );
}
