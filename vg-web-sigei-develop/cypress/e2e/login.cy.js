describe('Pruebas Funcionales - Página de Login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('Debería cargar la página de login correctamente', () => {
    // Verificar título de la página
    cy.contains('h2', '¡Bienvenido de vuelta! 👋').should('be.visible')

    // Verificar subtítulo
    cy.contains('Ingresa tus credenciales para continuar').should('be.visible')

    // Verificar campos del formulario
    cy.get('input[placeholder="Ingresa tu usuario"]').should('be.visible').and('be.enabled')
    cy.get('input[placeholder="Ingresa tu contraseña"]').should('be.visible').and('be.enabled')

    // Verificar botón de submit
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Iniciar Sesión')
  })

  it('Debería mostrar elementos de branding', () => {
    // Verificar logo
    cy.get('img[alt="SIGEI"]').should('be.visible')

    // Verificar título principal
    cy.contains('SIGEI').should('be.visible')
    cy.contains('Sistema Integrado de Gestión Educativa').should('be.visible')
  })

  it('Debería ser responsiva en diferentes tamaños', () => {
    // Verificar en desktop
    cy.viewport(1280, 720)
    cy.get('input[placeholder="Ingresa tu usuario"]').should('be.visible')

    // Verificar en tablet
    cy.viewport(768, 1024)
    cy.get('input[placeholder="Ingresa tu usuario"]').should('be.visible')

    // Verificar en móvil
    cy.viewport(375, 667)
    cy.get('input[placeholder="Ingresa tu usuario"]').should('be.visible')
  })

  it('Debería mostrar información de cards', () => {
    // Verificar cards informativas
    cy.contains('Gestión educativa').should('be.visible')
    cy.contains('Nivel inicial').should('be.visible')
    cy.contains('Acceso seguro').should('be.visible')
  })

  it('Debería validar campos requeridos', () => {
    // Intentar enviar formulario vacío
    cy.get('button[type="submit"]').click()

    // Verificar que no navega (debería mostrar alerta o mantener en login)
    cy.url().should('include', '/login')
  })

  it('Debería alternar visibilidad de contraseña', () => {
    const passwordInput = cy.get('input[placeholder="Ingresa tu contraseña"]')

    // Verificar que inicialmente es tipo password
    passwordInput.should('have.attr', 'type', 'password')

    // Hacer click en el botón de toggle
    cy.get('button').contains('button').parent().find('svg').parent().click()

    // Verificar que ahora es tipo text
    passwordInput.should('have.attr', 'type', 'text')

    // Hacer click nuevamente
    cy.get('button').contains('button').parent().find('svg').parent().click()

    // Verificar que vuelve a ser password
    passwordInput.should('have.attr', 'type', 'password')
  })

  it('Debería mantener el foco en campos', () => {
    // Hacer foco en campo de usuario
    cy.get('input[placeholder="Ingresa tu usuario"]').focus().should('have.focus')

    // Tab al campo de contraseña
    cy.get('input[placeholder="Ingresa tu contraseña"]').focus().should('have.focus')

    // Tab al botón
    cy.get('button[type="submit"]').focus().should('have.focus')
  })
})

describe('Pruebas Funcionales - Navegación General', () => {
  it('Debería redirigir a login cuando no hay sesión', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('Debería manejar URLs inválidas', () => {
    cy.visit('/pagina-inexistente')
    // Debería redirigir a login o mostrar página 404
    cy.url().should('include', '/login')
  })
})