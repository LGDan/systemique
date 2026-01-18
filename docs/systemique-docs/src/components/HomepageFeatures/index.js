import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/drag-and-drop-demo.svg').default,
    description: (
      <>
        Connect components together to form a system using predefined components and interfaces,
        or build your own. Set icons and descriptions, save, and reuse.
      </>
    ),
  },
  {
    title: 'Design and constrain your interfaces',
    Svg: require('@site/static/img/interface-customization-demo.svg').default,
    description: (
      <>
        Add input and output interfaces to your components, and set rules on them to ensure that only compatible interfaces can be connected.
        Validate your system for compatibility and security issues.
      </>
    ),
  },
  {
    title: 'Share and Report',
    Svg: require('@site/static/img/bom-demo.svg').default,
    description: (
      <>
        Export your system as a JSON file with full documentation, or as a Bill of Materials (BOM) and CSV file.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
