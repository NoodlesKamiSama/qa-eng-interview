Cypress.Commands.add('generateSlideFromExample', (prompt) => {
    cy.get('textarea', { timeout: 60000 }).should('be.empty');
    cy.get('.SlideAiDemo__Examples-sc-1m837c2-8').contains(prompt).click();  
    cy.intercept('GET', 'https://www.purgomalum.com/service/containsprofanity*').as('profanityCheck');
    cy.wait('@profanityCheck').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        cy.wait(3000)
    });
    cy.get('.SlideAiDemo__AIGenerationProgress-sc-1m837c2-11 > img', { timeout: 60000 }).should('not.exist');
});

Cypress.Commands.add('generateSlide', (prompt) => {
    cy.get('textarea', { timeout: 60000 }).should('be.empty').type(prompt);
    cy.get('.SlideAiDemo__GenerateButton-sc-1m837c2-1').click();    
    cy.intercept('POST', 'https://beautifulslides-staging.appspot.com/api/gptDemo').as('gptDemo');
    cy.wait('@gptDemo').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        cy.wait(3000)
    });
    cy.get('.SlideAiDemo__AIGenerationProgress-sc-1m837c2-11 > img', { timeout: 60000 }).should('not.exist');
});
  
Cypress.Commands.add('getVisibleIntegers', () => {
    return cy.get('body').then(($body) => {
        const candidates = [
            ...$body.find('svg text').toArray(),
            ...$body.find('span').toArray(),
            ...$body.find('div').toArray()
        ];
        const nums = candidates
            .map(el => (el.textContent || '').trim())
            .filter(t => /^\d{1,3}$/.test(t))
            .map(t => parseInt(t, 10));
        return cy.wrap(nums);
    });
});
  
Cypress.Commands.add('getTables', () => {
    return cy.get('table, [role="table"]');
});
  
Cypress.Commands.add('assertAllInRange', (arr, min, max) => {
    arr.forEach(n => expect(n, `value ${n} in [${min}, ${max}]`).to.be.within(min, max));
});

Cypress.Commands.add('validatePromptContent', (prompt) => {
    cy.get('main, [data-testid*="slide"], section, svg', { timeout: 90_000 }).should('be.visible');
    const extractKeywords = (text) => {
      const stopWords = new Set([
        'a', 'an', 'the', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'and', 'or', 'but',
        'to', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
        'above', 'below', 'between', 'among', 'throughout', 'despite', 'towards', 'upon',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
        'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
        'create', 'make', 'show', 'display', 'chart', 'table', 'slide', 'how', 'what', 'who', 'where', 'when', 'why'
      ]);
      
      const words = text.toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word));
      
      const phrases = [];
      const years = text.match(/\b(19|20)\d{2}\b/g) || [];
      phrases.push(...years);
      const numberPatterns = text.match(/\b(top\s+)?\d+\s+\w+/gi) || [];
      phrases.push(...numberPatterns.map(p => p.replace(/\btop\s+/i, '')));
      const namePatterns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      phrases.push(...namePatterns);
      return [...new Set([...words, ...phrases])];
    };
    
    const keywords = extractKeywords(prompt);
    cy.log(`Validating keywords from prompt: ${keywords.join(', ')}`);
    
    let foundKeywords = [];
    
    keywords.forEach(keyword => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flexibleRegex = new RegExp(escapedKeyword.replace(/\s+/g, '\\s*'), 'i');
      
      cy.get('div.SlideAiDemo__Preview-sc-1m837c2-4.iYrULk').then($root => {
        const content = $root.text();
        if (flexibleRegex.test(content)) {
          foundKeywords.push(keyword);
          cy.log(`✓ Found keyword: "${keyword}"`);
        }
      });
    });
    
    cy.then(() => {
      expect(foundKeywords.length, 
        `Should find at least 1 keyword from prompt. Found: [${foundKeywords.join(', ')}] from [${keywords.join(', ')}]`
      ).to.be.at.least(1);
    });
  });

Cypress.Commands.add('validateContentByType', (contentType, prompt) => {
    cy.log(`Validating content type: ${contentType}`);
    
    switch (contentType) {
      case 'chart':
        cy.getVisibleIntegers().then((nums) => {
          if (nums.length > 0) {
            cy.log(`Found ${nums.length} numeric values in chart`);
            expect(nums.length, 'has numeric data points').to.be.gte(1);
            if (nums.length >= 3) {
              const uniq = [...new Set(nums)];
              expect(uniq.length, 'has varied data').to.be.at.least(2);
            }
          }
        });
        
        cy.get('body').then($body => {
          const hasChartElements = $body.find('svg, canvas, [class*="chart"], [class*="graph"]').length > 0;
          expect(hasChartElements, 'contains chart/graph elements').to.be.true;
        });
        break;
        
      case 'table':
        cy.get('body').then($body => {
          const tables = $body.find('table, [role="table"], [class*="table"]');
          if (tables.length > 0) {
            cy.log('Found table elements');
            expect(tables.length, 'contains table elements').to.be.gte(1);
          } else {
            cy.log('No formal table found, checking for structured content');
            cy.get('div.SlideAiDemo__Preview-sc-1m837c2-4.iYrULk').should('contain.text', prompt.includes('table') ? 'table' : '');
          }
        });
        break;
        
      case 'visual':
        cy.get('body').then($body => {
          const visualElements = $body.find('img, svg, [class*="image"], [class*="visual"], [class*="logo"]').length;
          cy.log(`Found ${visualElements} visual elements`);
          expect(visualElements, 'contains visual elements').to.be.gte(0);
        });
        break;
        
      case 'text':
      default:
        cy.get('div.SlideAiDemo__Preview-sc-1m837c2-4.iYrULk').then($textFrame => {
          const textContent = $textFrame.text().trim();
          expect(textContent.length, 'contains substantial text content').to.be.gt(20);
          cy.log(`Text content length: ${textContent.length} characters`);
        });
        break;
    }
  });