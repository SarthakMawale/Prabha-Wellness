const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_DIR = path.join(__dirname, 'src', 'app');

function fixHref(href) {
    if (!href) return href;
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return href;
    }
    
    // Remove .html
    let cleaned = href.replace(/\.html/g, '');
    
    // Make absolute
    if (!cleaned.startsWith('/')) {
        cleaned = '/' + cleaned;
    }
    
    // Fix index -> /
    if (cleaned === '/index') {
        return '/';
    }
    
    return cleaned;
}

function processFile(filePath) {
    const fileName = path.basename(filePath);
    if (!fileName.endsWith('.html')) return;

    console.log(`Processing: ${fileName}`);
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    const title = $('title').text() || 'PRABHA WELLNESS';
    
    // Extract scripts
    const scripts = [];
    const inlineScripts = [];
    $('script').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
            scripts.push(src);
        } else {
            const inner = $(el).html();
            if (inner) inlineScripts.push(inner);
        }
    });

    // Extract inline styles from <head> to inject in the component
    const styles = [];
    $('head style').each((_, el) => {
        styles.push($(el).html());
    });

    // Remove scripts to prevent double execution
    $('script').remove();

    // Re-assign href for a tags
    $('a').each((_, el) => {
        let href = $(el).attr('href');
        $(el).attr('href', fixHref(href));
    });

    // The body HTML
    const bodyHtml = $('body').html() || '';

    // Route logic
    let routeName = fileName.replace('.html', '');
    let routeDir = path.join(APP_DIR, routeName === 'index' ? '' : routeName);
    
    if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
    }

    const pageCode = `
import VanillaPage from '@/components/VanillaPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
};

const html = ${JSON.stringify(bodyHtml)};
const scripts: string[] = ${JSON.stringify(scripts)};
const inlineScripts: string[] = ${JSON.stringify(inlineScripts)};
const styles: string[] = ${JSON.stringify(styles)};

export default function Page() {
  return (
    <>
      {styles.map((css, i) => <style key={i} dangerouslySetInnerHTML={{ __html: css }} />)}
      <VanillaPage html={html} scripts={scripts} inlineScripts={inlineScripts} />
    </>
  );
}
`;

    fs.writeFileSync(path.join(routeDir, 'page.tsx'), pageCode.trim() + '\n');
}

// Read top level HTML files
fs.readdirSync(PUBLIC_DIR).forEach(file => {
    const fullPath = path.join(PUBLIC_DIR, file);
    if (fs.statSync(fullPath).isFile()) {
        processFile(fullPath);
    }
});

// Process features subdirectory
const featuresDir = path.join(PUBLIC_DIR, 'features');
if (fs.existsSync(featuresDir)) {
    fs.readdirSync(featuresDir).forEach(file => {
        const fullPath = path.join(featuresDir, file);
        if (fs.statSync(fullPath).isFile() && file.endsWith('.html')) {
            const fileName = path.basename(file).replace('.html', '');
            const routeDir = path.join(APP_DIR, 'features', fileName);
            if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
            
            const htmlContent = fs.readFileSync(fullPath, 'utf-8');
            const $ = cheerio.load(htmlContent);
            const title = $('title').text() || 'PRABHA WELLNESS';
            
            const scripts = [];
            const inlineScripts = [];
            $('script').each((_, el) => {
                const src = $(el).attr('src');
                if (src) scripts.push(src);
                else inlineScripts.push($(el).html() || '');
            });
            $('script').remove();

            $('a').each((_, el) => {
                let href = $(el).attr('href');
                let h = fixHref(href);
                // if the feature page points to a root page like login, we handle it natively with fixHref
                $(el).attr('href', h);
            });

            const styles = [];
            $('head style').each((_, el) => {
                styles.push($(el).html());
            });
            
            const bodyHtml = $('body').html() || '';
            
            const pageCode = `
import VanillaPage from '@/components/VanillaPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
};

const html = ${JSON.stringify(bodyHtml)};
const scripts: string[] = ${JSON.stringify(scripts)};
const inlineScripts: string[] = ${JSON.stringify(inlineScripts)};
const styles: string[] = ${JSON.stringify(styles)};

export default function Page() {
  return (
    <>
      {styles.map((css, i) => <style key={i} dangerouslySetInnerHTML={{ __html: css }} />)}
      <VanillaPage html={html} scripts={scripts} inlineScripts={inlineScripts} />
    </>
  );
}
`;
            fs.writeFileSync(path.join(routeDir, 'page.tsx'), pageCode.trim() + '\n');
        }
    });
}
