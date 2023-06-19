import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageDocs from '@site/src/components/HomepageDocs';

import styles from './index.module.css';
import Footer from '../components/Footer';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1
          className={clsx('hero__title', styles.customHeroTitle)}
        >{`Welcome to ${siteConfig.title} for Developers`}</h1>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
      noFooter
    >
      <HomepageHeader />
      <main>
        <HomepageDocs />
      </main>
      <Footer />
    </Layout>
  );
}
