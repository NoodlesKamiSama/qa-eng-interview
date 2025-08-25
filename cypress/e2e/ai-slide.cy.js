/// <reference types="cypress" />

describe('AI-generated slides: stable validations', () => {

    beforeEach(() => {        
        cy.visit('/slideAIDemo');
        
        // Wait for key elements to be present and interactable
        cy.get('textarea', { timeout: 15000 }).should('be.visible').and('not.be.disabled');
        
        // Ensure no loading indicators are present
        cy.get('body').should('not.contain.text', 'Loading...')
            .and('not.contain.text', 'Please wait');
        
        // Wait for the page to be in a stable state (DOM ready)
        cy.document().should('have.property', 'readyState', 'complete');
    });

    context('Example prompts validation', () => {
        
        const testScenarios = [
            { type: 'text', description: 'Einstein quote' },
            { type: 'visual', description: 'Timeline of great future inventions' },
            { type: 'chart', description: 'Social media chart' },
            { type: 'table', description: 'Superbowl table' }
        ];
        testScenarios.forEach((scenario) => {
            it(`should validate ${scenario.type} content: ${scenario.description}`, { tags: ['@example', '@slides'] }, () => {
                cy.fixture('prompts').then((data) => {
                    const example = data.examples.find(p => p.type === scenario.type);
                    cy.generateSlideFromExample(example.prompt);
                    cy.validatePromptContent(example.prompt);
                    cy.validateContentByType(example.type, example.prompt);
                });
            });
        });
    });

        it('should validate streaming services ranking with numeric data', { tags: ['@streaming', '@example', '@slides'] }, () => {
            cy.fixture('prompts').then((promptData) => {
                const streamingExample = promptData.examples.find(p => 
                    p.prompt.includes('streaming services')
                );
                cy.generateSlideFromExample(streamingExample.prompt);
                cy.validatePromptContent(streamingExample.prompt);
                cy.validateContentByType(streamingExample.type, streamingExample.prompt);
            });
        });

    context('Custom prompt validation', () => {

        it('should generate and validate a custom deterministic prompt', { tags: ['@custom', '@slides'] }, () => {
            cy.fixture('prompts').then((promptData) => {
                const customPrompt = promptData.custom;
                cy.generateSlide(customPrompt.prompt);
                cy.validatePromptContent(customPrompt.prompt);
                cy.validateContentByType(customPrompt.type, customPrompt.prompt);
                if (customPrompt.expectedContent) {
                    const expected = customPrompt.expectedContent;
                    
                    if (expected.languages) {
                        expected.languages.forEach(language => {
                            cy.get('div.SlideAiDemo__Preview-sc-1m837c2-4.iYrULk').contains(language);
                        });
                    }
                    
                    if (expected.hasNumericScores) {
                        cy.getVisibleIntegers().then((nums) => {
                            if (nums.length > 0) {
                                cy.log(`Found ${nums.length} numeric scores`);
                                expect(nums.length, 'has numeric scores').to.be.gte(1);
                                
                                nums.forEach(n => {
                                    expect(n, `score ${n} in valid range`).to.be.within(1, 100);
                                });
                            }
                        });
                    }
                }
            });
        });
    });
});