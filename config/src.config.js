const { lstatSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const pageDirectories = getDirectories(join(__dirname, '../src'));

const getPageTitle = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<title>(.*?)<\/title>/g)[0]
    .replace('<title>', '')
    .replace('</title>', '');
};

const getPageCategory = path => {
  const html = readFileSync(path, 'utf8');
  return html
    .match(/<meta name="category" content="(.*?)" \/>/g)[0]
    .replace('<meta name="category" content="', '')
    .replace('" />', '');
};

const pages = pageDirectories.map(pageDirectory => {
  const slug = pageDirectory.split('/').reverse()[0];
  const html = join(pageDirectory, 'index.html');
  const js = join(pageDirectory, 'index.js');
  const name = getPageTitle(join(pageDirectory, 'index.html'));
  const category = getPageCategory(join(pageDirectory, 'index.html'));

  const page = { slug, html, js, name, category };

  return page;
});

module.exports = {
  entry: {
    ...pages
      .map(page => ({
        [page.slug]: page.js,
      }))
      .reduce(
        (acc, curr) => ({
          ...acc,
          ...curr,
        }),
        {}
      ),
  },
  plugins: [
    ...pages.map(page => {
      const meta = `
        <meta name="twitter:title" content="${page.name}" />
        <meta name="og:title" content="${page.name}" />
        <meta
          name="twitter:image"
          content="https://lab.julienverneaut.com/${page.slug}/screenshot.png"
        />
        <meta
          property="og:image"
          content="https://lab.julienverneaut.com/${page.slug}/screenshot.png"
        />
      `;

      return new HtmlWebpackPlugin({
        chunks: [page.slug, 'global'],
        filename: page.slug + '/index.html',
        metaString: meta,
        template: page.html,
        alwaysWriteToDisk: true,
      });
    }),
  ],
};
