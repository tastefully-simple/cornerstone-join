describe('Test Home Page Seaerch', () => {
    it('Search and confirm results returned', () => {
      cy.visit('https://tastefully-simple-sandbox-2.mybigcommerce.com/')
  
      cy.get('input[name="search_query_adv"]').type('Beer Bread')

      cy.get('button[class="button--search"]').click()

      cy.contains('0 results for').should('not.exist')
    })
  })