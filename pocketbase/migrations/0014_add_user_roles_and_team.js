migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campos role (perfil de acesso) e equipe (equipe departamental)
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'gestor', 'operador', 'leitura'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('equipe')) {
      usersCol.fields.add(
        new SelectField({
          name: 'equipe',
          values: ['Administração', 'Saúde', 'Educação', 'Financeiro', 'Projetos', 'Jurídico'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('cargo')) {
      usersCol.fields.add(
        new TextField({
          name: 'cargo',
        }),
      )
    }

    if (!usersCol.fields.getByName('ativo')) {
      usersCol.fields.add(
        new BoolField({
          name: 'ativo',
        }),
      )
    }

    // 2. Atualizar regras de acesso da coleção users para que usuários autenticados possam listar e gerenciar
    // Administrador ou usuários autenticados
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.createRule = "@request.auth.id != ''"
    usersCol.updateRule = "@request.auth.id != ''"
    usersCol.deleteRule = "@request.auth.id != ''"

    app.save(usersCol)

    // 3. Garantir que o usuário admin existente receba perfil admin e equipe Administração
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'edianedalbosco@gmail.com')
      adminUser.set('role', 'admin')
      adminUser.set('equipe', 'Administração')
      adminUser.set('cargo', 'Administradora Geral')
      adminUser.set('ativo', true)
      app.save(adminUser)
    } catch (_) {}
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) usersCol.fields.remove(roleField)
    const equipeField = usersCol.fields.getByName('equipe')
    if (equipeField) usersCol.fields.remove(equipeField)
    const cargoField = usersCol.fields.getByName('cargo')
    if (cargoField) usersCol.fields.remove(cargoField)
    const ativoField = usersCol.fields.getByName('ativo')
    if (ativoField) usersCol.fields.remove(ativoField)

    // Reverter regras padrão
    usersCol.listRule = 'id = @request.auth.id'
    usersCol.viewRule = 'id = @request.auth.id'
    usersCol.createRule = ''
    usersCol.updateRule = 'id = @request.auth.id'
    usersCol.deleteRule = 'id = @request.auth.id'

    app.save(usersCol)
  },
)
