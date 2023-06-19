import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

type DocItem = {
  title: string;
  description: JSX.Element;
  link: string;
};

const FeatureList: DocItem[] = [
  {
    title: 'Web SDK',
    description: (
      <>Arena Chat SDK is the official JavaScript client for Arena Chat, a service for building chat applications.</>
    ),
    link: 'category/web-sdk',
  },
  {
    title: 'Android SDK',
    description: (
      <>Arena Chat SDK is the official JavaScript client for Arena Chat, a service for building chat applications.</>
    ),
    link: 'category/android-sdk',
  },
  {
    title: 'IOS SDK',
    description: (
      <>Arena Chat SDK is the official JavaScript client for Arena Chat, a service for building chat applications.</>
    ),
    link: 'category/ios-sdk',
  },
  {
    title: 'Api V3',
    description: <>API to manage customer resources.</>,
    link: 'api',
  },
];

function DocCard({ title, link, description }: DocItem) {
  return (
    <div className={clsx('col col--4', styles.docCard)}>
      <div className="text--center">
        <h3>{title}</h3>
        <p>{description}</p>
        <Link to={link}>{title}</Link>
      </div>
    </div>
  );
}

export default function HomepageDocs(): JSX.Element {
  return (
    <section className={styles.docs}>
      <div className="container">
        <div className={clsx('row', styles.docCards)}>
          {FeatureList.map((props, idx) => (
            <DocCard key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
