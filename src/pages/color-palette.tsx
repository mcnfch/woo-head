import React from 'react';
import Head from 'next/head';

const ColorPalette = () => {
  const colors = {
    primary: {
      richBlack: '#0D0D0D',
      white: '#FFFFFF',
      vividLavender: '#B85EFF',
    },
    secondary: {
      deepLavender: '#9747FF',
      softLavender: '#D8B5FF',
      electricPurple: '#7000FF',
    },
    ui: {
      neonPink: '#FF2E9F',
      mintGreen: '#00FFB2',
      brightRed: '#FF3D57',
    }
  };

  const ColorBlock = ({ color, name }: { color: string; name: string }) => (
    <div className="color-block">
      <div style={{ backgroundColor: color }} className="color-square"></div>
      <div className="color-info">
        <p className="color-name">{name}</p>
        <p className="color-hex">{color}</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Color Palette Preview</title>
      </Head>
      <div className="container">
        <h1>Color Palette Preview</h1>
        
        <section>
          <h2>Primary Colors</h2>
          <div className="color-grid">
            {Object.entries(colors.primary).map(([key, value]) => (
              <ColorBlock key={key} color={value} name={key} />
            ))}
          </div>
        </section>

        <section>
          <h2>Secondary Colors</h2>
          <div className="color-grid">
            {Object.entries(colors.secondary).map(([key, value]) => (
              <ColorBlock key={key} color={value} name={key} />
            ))}
          </div>
        </section>

        <section>
          <h2>UI State Colors</h2>
          <div className="color-grid">
            {Object.entries(colors.ui).map(([key, value]) => (
              <ColorBlock key={key} color={value} name={key} />
            ))}
          </div>
        </section>

        <style jsx>{`
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            font-family: system-ui, -apple-system, sans-serif;
          }

          h1 {
            text-align: center;
            margin-bottom: 3rem;
          }

          section {
            margin-bottom: 3rem;
          }

          h2 {
            margin-bottom: 1.5rem;
          }

          .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
          }

          .color-block {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .color-square {
            width: 200px;
            height: 200px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 1rem;
          }

          .color-info {
            text-align: center;
          }

          .color-name {
            font-weight: 600;
            margin: 0.5rem 0;
            text-transform: capitalize;
          }

          .color-hex {
            font-family: monospace;
            color: #666;
            margin: 0;
          }
        `}</style>
      </div>
    </>
  );
};

export default ColorPalette;
