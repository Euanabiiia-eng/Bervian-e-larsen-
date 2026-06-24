import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Plataforma Ápice...')

  // ─── Clínica ──────────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'bervian-larsen' },
    update: {},
    create: {
      nome: 'Clínica Bervian & Larsen',
      slug: 'bervian-larsen',
      corPrimaria: '#8B6914',
      corSecundaria: '#0E0D0C',
      plano: 'pro',
      ativo: true,
    },
  })
  console.log('✓ Clínica criada:', clinic.nome)

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('apice2026', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bervianlarsen.com.br' },
    update: {},
    create: {
      clinicId: clinic.id,
      nome: 'Administrador Ápice',
      email: 'admin@bervianlarsen.com.br',
      senhaHash: adminHash,
      role: 'clinic_admin',
      telefone: '(51) 3000-0000',
    },
  })

  // ─── Médicos ──────────────────────────────────────────────────────────────
  const bervianHash = await bcrypt.hash('apice2026', 12)
  const bervianUser = await prisma.user.upsert({
    where: { email: 'fabricio@bervianlarsen.com.br' },
    update: {},
    create: {
      clinicId: clinic.id,
      nome: 'Dr. Fabrício Bervian',
      email: 'fabricio@bervianlarsen.com.br',
      senhaHash: bervianHash,
      role: 'doctor',
      telefone: '(51) 3000-0001',
    },
  })

  const medBervian = await prisma.medico.upsert({
    where: { userId: bervianUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: bervianUser.id,
      crm: 'CRM/RS 22345',
      especialidade: 'Cirurgia Facial e Rinoplastia',
      formacao:
        'Residência em Cirurgia Plástica — Hospital das Clínicas FMUSP. Fellowship em Cirurgia Facial — Cleveland Clinic (EUA).',
      bio: 'Especialista em cirurgia facial e rinoplastia com mais de 15 anos de experiência. Referência nacional em rinoplastia étnica e facial.',
      agenda: 'Seg Ter Qui',
    },
  })

  const larsenHash = await bcrypt.hash('apice2026', 12)
  const larsenUser = await prisma.user.upsert({
    where: { email: 'guilherme@bervianlarsen.com.br' },
    update: {},
    create: {
      clinicId: clinic.id,
      nome: 'Dr. Guilherme Larsen',
      email: 'guilherme@bervianlarsen.com.br',
      senhaHash: larsenHash,
      role: 'doctor',
      telefone: '(51) 3000-0002',
    },
  })

  const medLarsen = await prisma.medico.upsert({
    where: { userId: larsenUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: larsenUser.id,
      crm: 'CRM/RS 23456',
      especialidade: 'Cirurgia Corporal e Mamária',
      formacao:
        'Residência em Cirurgia Plástica — ISCMPA. Especialização em Body Contouring — Miami, FL.',
      bio: 'Especialista em contorno corporal, abdominoplastia e cirurgia mamária. Mais de 2.000 procedimentos realizados com técnica refinada e resultados naturais.',
      agenda: 'Seg Qua Sex',
    },
  })
  console.log('✓ Médicos criados')

  // ─── Hospitais ────────────────────────────────────────────────────────────
  const hospMoinhos = await prisma.hospital.upsert({
    where: { id: 'hosp-moinhos' },
    update: {},
    create: {
      id: 'hosp-moinhos',
      clinicId: clinic.id,
      nome: 'Hospital Moinhos de Vento',
      tipo: 'Hospital',
      endereco: 'Rua Ramiro Barcelos, 910',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3314-3434',
      contato: 'Centro Cirúrgico — Bloco B, 3º andar',
      obs: 'Referência em excelência hospitalar no Sul do Brasil.',
    },
  })

  const hospSaoLucas = await prisma.hospital.upsert({
    where: { id: 'hosp-sao-lucas' },
    update: {},
    create: {
      id: 'hosp-sao-lucas',
      clinicId: clinic.id,
      nome: 'Hospital São Lucas — PUCRS',
      tipo: 'Hospital',
      endereco: 'Av. Ipiranga, 6690',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3320-3000',
      contato: 'Bloco D, Centro Cirúrgico',
    },
  })

  const hospVenancio = await prisma.hospital.upsert({
    where: { id: 'hosp-venancio' },
    update: {},
    create: {
      id: 'hosp-venancio',
      clinicId: clinic.id,
      nome: 'Venâncio Day Hospital',
      tipo: 'Day Hospital',
      endereco: 'Av. Carlos Gomes, 1492',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3061-7000',
      contato: 'Atendimento Day Hospital',
      obs: 'Especializado em procedimentos ambulatoriais de alta complexidade.',
    },
  })
  console.log('✓ Hospitais criados')

  // ─── Procedimentos ────────────────────────────────────────────────────────
  const procRino = await prisma.procedimento.upsert({
    where: { id: 'proc-rinoplastia' },
    update: {},
    create: {
      id: 'proc-rinoplastia',
      clinicId: clinic.id,
      hospitalId: hospMoinhos.id,
      nome: 'Rinoplastia Primária',
      categoria: 'Facial',
      duracaoMin: 180,
      anestesia: 'Geral',
      valorBase: 22000,
      internacao: 'Day Hospital',
      recuperacaoDias: 14,
      lembrete:
        'Evite exposição solar direta por 30 dias. Use o protetor nasal conforme orientação.',
      descricao:
        'A rinoplastia é uma das cirurgias estéticas mais delicadas e transformadoras. Corrige imperfeições funcionais e estéticas do nariz, harmonizando com as demais estruturas faciais.',
      orientacoesPre: `JEJUM E ALIMENTAÇÃO
Jejum de 8 horas para sólidos e líquidos espessos.
Água pura pode ser ingerida até 4 horas antes da cirurgia.
Nada deve ser ingerido após as 23h do dia anterior.

HIGIENE E PREPARAÇÃO
Banho com sabonete antisséptico (Clorexidina 2%) na noite anterior e na manhã da cirurgia.
Lavar o cabelo completamente.
Não usar maquiagem, esmalte nas unhas, perfume ou qualquer cosmético.
Remover acessórios: brincos, anéis, pulseiras, piercings.

VESTUÁRIO
Roupas confortáveis e folgadas — preferencialmente abertas na frente (sem camiseta que precise ser puxada pela cabeça).

MEDICAMENTOS
Suspender aspirina (AAS) e anti-inflamatórios 10 dias antes.
Suspender anticoagulantes conforme prescrição médica específica.
Medicamentos de uso contínuo: consultar o Dr. Bervian individualmente.

ACOMPANHANTE
Um acompanhante adulto é obrigatório e deve permanecer no hospital durante todo o procedimento.
O acompanhante deverá conduzir o paciente para casa.

DOCUMENTAÇÃO OBRIGATÓRIA
RG ou CPF original.
Todos os exames pré-operatórios em mãos.
Termos de consentimento assinados (fornecidos pela clínica).`,
      orientacoesPos: `PRIMEIRAS 48 HORAS
Mantenha repouso absoluto com a cabeça elevada (apoio adicional no travesseiro).
Aplique compressas de gelo (protegido por pano) por 15 minutos a cada hora nas primeiras 24h.
Não assoar o nariz — apenas limpar com cotonete macio se necessário.
Pode haver leve sangramento nas primeiras horas — normal e esperado.

CURATIVO E PROTETOR
Mantenha o protetor nasal rígido pelo tempo prescrito (geralmente 7-10 dias).
Não molhar a região. Evite banhos de imersão.
Não manuseie, aperte ou toque no nariz.

MEDICAÇÃO PÓS-OP
Siga rigorosamente a receita pós-operatória fornecida.
Analgésico: conforme prescrição para dor.
Antibiótico: complete o ciclo completo.
Corticoide: reduz edema — não interrompa sem orientação médica.

ALIMENTAÇÃO
Alimentos frios ou em temperatura ambiente nas primeiras 24h.
Evite mastigar alimentos duros — prefira macios ou pastosos por 7 dias.
Hidratação abundante.

RESTRIÇÕES IMPORTANTES
Sem atividades físicas por 30 dias.
Sem exposição solar direta na face por 30 dias — protetor solar obrigatório após liberação.
Sem óculos apoiados no nariz por 6 semanas (substituir por óculos presos à testa).
Sem natação ou piscina por 30 dias.

RETORNO
Retorno obrigatório em 7 dias para retirada do protetor.
Retorno aos 30 dias para avaliação e liberação de atividades.
Agende sua consulta de retorno ao receber alta.`,
      materiais: `Protetor nasal rígido pós-operatório
Micropore hipoalergênico (3M)
Soro fisiológico 0,9% — ampolas de 10ml (caixa com 10)
Cotonetes estéreis
Compressas de gaze estéril
Clorexidina solução degermante 2%
Pomada Bepantol para narinas (conforme prescrição)
Analgésico Dipirona 500mg comprimidos
Antibiótico Amoxicilina 875mg (conforme prescrição)
Corticoide Dexametasona 4mg (conforme prescrição)
Anti-histamínico Loratadina 10mg
Protetor solar FPS 50+ sem perfume`,
      complementares: 'Blefaroplastia, Ritidoplastia, Lifting Cervical',
    },
  })

  await prisma.respostaIA.createMany({
    skipDuplicates: true,
    data: [
      {
        procedimentoId: procRino.id,
        palavrasChave: 'jejum,comer,beber,sólido,água,alimenta,comer antes',
        resposta:
          'O jejum deve ser de 8 horas para sólidos e líquidos espessos. Água pura pode ser ingerida até 4 horas antes. Nada após as 23h do dia anterior. Se tiver dúvida sobre algum alimento específico, nossa equipe pode esclarecer. 🌿',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'remédio,medicamento,tomar,comprimido,suspender,anticoagulante,aspirina,aas',
        resposta:
          'Aspirina (AAS) e anti-inflamatórios devem ser suspensos 10 dias antes. Anticoagulantes, conforme prescrição médica específica. Medicamentos de uso contínuo (pressão, tireoide, etc.) precisam de avaliação individual com o Dr. Bervian. Nunca suspenda por conta própria.',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'hospital,internação,chegar,horário,entrada,endereço,onde,local',
        resposta:
          'Sua internação está confirmada no Hospital Moinhos de Vento — Rua Ramiro Barcelos, 910, Porto Alegre. Entrada pela recepção principal. Centro Cirúrgico Bloco B, 3º andar. O horário exato será confirmado 48h antes pela nossa equipe. 🌿',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'nariz,assoar,sangrar,sangramento,cotonete,limpar',
        resposta:
          'Não assoar o nariz nas primeiras 2-3 semanas. Pequeno sangramento nas primeiras horas é normal. Para limpar, use cotonete macio umedecido com soro fisiológico com muita delicadeza. Sangramento intenso deve ser comunicado imediatamente.',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'óculos,visão,lente,lentes',
        resposta:
          'Óculos comuns não podem ser apoiados no nariz por 6 semanas. Substituir por óculos presos à testa com fita. Lentes de contato podem ser usadas normalmente. Após liberação médica, óculos podem ser usados normalmente.',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'exercício,academia,atividade física,correr,treinar,malhação',
        resposta:
          'Atividades físicas devem ser suspensas por 30 dias completos. Após esse período, o retorno é gradual: caminhada leve na semana 5, exercícios moderados na semana 6-8, exercícios intensos somente após autorização médica. 🌿',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'sol,solar,praia,protetor,exposição',
        resposta:
          'Exposição solar direta na face deve ser evitada por 30 dias. Após esse período, use protetor solar FPS 50+ sem perfume sempre que sair. A pele ficará mais sensível por alguns meses — proteção é fundamental para o resultado final.',
      },
      {
        procedimentoId: procRino.id,
        palavrasChave: 'inchaço,edema,hematoma,roxo,olhos,olheiras',
        resposta:
          'Inchaço e hematomas ao redor dos olhos são esperados e normais nas primeiras 2 semanas — parte do processo de cicatrização. Compressas de gelo nas primeiras 24h ajudam. O edema residual sutil pode durar alguns meses, mas é imperceptível para terceiros. 🌿',
      },
    ],
  })

  await prisma.procedimentoVideo.createMany({
    skipDuplicates: true,
    data: [
      {
        procedimentoId: procRino.id,
        titulo: 'Entendendo a Rinoplastia: O que esperar',
        url: 'https://www.youtube.com/watch?v=exemplo-rino-1',
        duracao: '8:24',
        descricao:
          'Dr. Bervian explica em detalhes o procedimento de rinoplastia, técnicas utilizadas e expectativas de resultado.',
        ordem: 1,
      },
      {
        procedimentoId: procRino.id,
        titulo: 'Pós-operatório: Sua recuperação passo a passo',
        url: 'https://www.youtube.com/watch?v=exemplo-rino-2',
        duracao: '11:15',
        descricao: 'Guia completo de recuperação: cuidados diários, restrições e quando retomar atividades.',
        ordem: 2,
      },
      {
        procedimentoId: procRino.id,
        titulo: 'Galeria de Resultados — Rinoplastia',
        url: 'https://www.youtube.com/watch?v=exemplo-rino-3',
        duracao: '5:42',
        descricao: 'Galeria de casos reais com antes e depois de rinoplastias realizadas pelo Dr. Bervian.',
        ordem: 3,
      },
    ],
  })

  const procBlefaroplastia = await prisma.procedimento.upsert({
    where: { id: 'proc-blefaroplastia' },
    update: {},
    create: {
      id: 'proc-blefaroplastia',
      clinicId: clinic.id,
      hospitalId: hospVenancio.id,
      nome: 'Blefaroplastia',
      categoria: 'Facial',
      duracaoMin: 90,
      anestesia: 'Local com Sedação',
      valorBase: 14000,
      internacao: 'Day Hospital',
      recuperacaoDias: 10,
      lembrete: 'Use óculos de sol por 30 dias. Não esfregue os olhos nas primeiras semanas.',
      descricao:
        'A blefaroplastia corrige o excesso de pele nas pálpebras, rejuvenescendo o olhar e eliminando a aparência de cansaço. Pode ser realizada nas pálpebras superiores, inferiores ou em ambas.',
      orientacoesPre: `JEJUM
Jejum de 6 horas para sólidos.
Água pode ser ingerida até 2 horas antes.

HIGIENE
Lavar o cabelo antes (não poderá lavar imediatamente após).
Não usar maquiagem nos olhos ou cílios postiços.
Remover lentes de contato antes de entrar.

MEDICAMENTOS
Suspender anti-inflamatórios e aspirina 7 dias antes.
Trazer lista de todos os medicamentos em uso.

TRANSPORTE
Acompanhante obrigatório para condução após o procedimento.`,
      orientacoesPos: `PRIMEIRAS 48H
Compressas de gelo nas pálpebras a cada 2 horas (15 min).
Manter cabeça elevada ao dormir.
Não coçar ou esfregar os olhos.

COLÍRIOS E POMADAS
Use os colírios e pomadas conforme prescrição — essenciais para cicatrização.

ATIVIDADES
Sem leitura ou telas por 48 horas.
Retorno ao trabalho (sem esforço) em 7-10 dias.
Sem atividade física por 20 dias.

VISÃO
Visão levemente embaçada nas primeiras horas é normal.
Comunicar qualquer dor intensa, perda de visão ou assimetria preocupante.`,
      materiais: `Compressas de gaze estéril
Colírio lubrificante (conforme prescrição)
Pomada oftálmica antibiótica (conforme prescrição)
Óculos de sol com proteção UV total
Saco de gelo reutilizável`,
      complementares: 'Rinoplastia, Ritidoplastia',
    },
  })

  const procAbdominoplastia = await prisma.procedimento.upsert({
    where: { id: 'proc-abdominoplastia' },
    update: {},
    create: {
      id: 'proc-abdominoplastia',
      clinicId: clinic.id,
      hospitalId: hospSaoLucas.id,
      nome: 'Abdominoplastia',
      categoria: 'Corporal',
      duracaoMin: 240,
      anestesia: 'Geral ou Raqui + Sedação',
      valorBase: 28000,
      internacao: 'Hospital (1 noite)',
      recuperacaoDias: 30,
      lembrete:
        'Mantenha a cinta por 30-45 dias. Evite esforço abdominal. Caminhe em posição levemente curvada nas primeiras 2 semanas.',
      descricao:
        'A abdominoplastia remove o excesso de pele e gordura abdominal, corrige a diástase (separação dos músculos) e reposiciona o umbigo, proporcionando abdome firme e contornado.',
      orientacoesPre: `PREPARAÇÃO FÍSICA
Estar próximo ao peso ideal — cirurgia não é método de emagrecimento.
Não engravidar após a cirurgia sem avaliação médica.
Parar de fumar pelo menos 30 dias antes (fumo compromete cicatrização).

JEJUM
8 horas completas para sólidos e líquidos espessos.
Água até 4 horas antes.

TRICOTOMIA
Depilar a região pubiana antes (2-3 dias antes, não no dia).

MEDICAMENTOS
Suspender anticoagulantes conforme prescrição.
Suspender AAS/anti-inflamatórios 10 dias antes.
Suspender anticoncepcionais 30 dias antes se autorizado pelo ginecologista.

LOGÍSTICA
Internação de 1 noite — providenciar necessidades pessoais.
Acompanhante obrigatório para retorno para casa.
Preparar o quarto com travesseiros para elevação das pernas.`,
      orientacoesPos: `POSIÇÃO
Deambulação levemente curvada para frente por 10-14 dias (posição de bailarina).
Evitar ficar deitado completamente plano — use travesseiro sob os joelhos.

CINTA CIRÚRGICA
Usar continuamente por 30-45 dias (remover apenas para banho).
A cinta modela o resultado final — essencial.

DRENO
Se tiver dreno, instrução específica será dada na alta hospitalar.
Não remover sem autorização médica.

BANHO
Banho sentado nas primeiras 72h.
Não molhar o curativo até liberação.
Usar banho de chuveiro (não imersão) por 30 dias.

ATIVIDADES
Sem esforço abdominal por 30 dias.
Sem academia por 45-60 dias.
Dirigir somente após 15-20 dias e com autorização médica.
Retorno ao trabalho (escritório): 15-20 dias.

CICATRIZ
A cicatriz fica abaixo da linha da calcinha — imperceptível em biquíni.
Manter protegida do sol por 12 meses.
Iniciar massagem cicatricial após liberação médica (4-6 semanas).`,
      materiais: `Cinta abdominal média (tamanho correspondente ao manequim da paciente)
Absorventes higiênicos para curativo
Gaze estéril
Soro fisiológico 0,9% — 250ml
Micropore largo (3M)
Antibiótico conforme prescrição
Anticoagulante conforme prescrição (se indicado)
Analgésico e anti-inflamatório conforme prescrição`,
      complementares: 'Lipoaspiração, Mamoplastia',
    },
  })

  const procMamoplastia = await prisma.procedimento.upsert({
    where: { id: 'proc-mamoplastia' },
    update: {},
    create: {
      id: 'proc-mamoplastia',
      clinicId: clinic.id,
      hospitalId: hospSaoLucas.id,
      nome: 'Mamoplastia de Aumento',
      categoria: 'Mamário',
      duracaoMin: 150,
      anestesia: 'Geral',
      valorBase: 24000,
      internacao: 'Day Hospital',
      recuperacaoDias: 21,
      lembrete: 'Use o sutiã cirúrgico por 30 dias. Sem movimentos bruscos dos braços nas primeiras semanas.',
      descricao:
        'A mamoplastia de aumento utiliza próteses de silicone de alta coesidade para aumentar, remodelar e harmonizar o volume das mamas, garantindo resultado natural e simétrico.',
      orientacoesPre: `ESCOLHA DA PRÓTESE
O tipo, volume e perfil da prótese são definidos em consulta — trazer fotos de referência.
Consulta de simulação disponível com implantes de prova.

PREPARAÇÃO
Suspender anticoncepcionais 30 dias antes (se orientado).
Mamografia ou ultrassom mamário pré-operatório obrigatório (acima de 35 anos ou conforme solicitação).
Jejum completo de 8 horas.
Banho com Clorexidina na noite anterior e manhã da cirurgia.

MEDICAMENTOS
Suspender AAS e anti-inflamatórios 10 dias antes.`,
      orientacoesPos: `SUTIÃ CIRÚRGICO
Usar continuamente por 30 dias (apenas remover para banho rápido).
Seguir orientação específica sobre o modelo correto.

POSIÇÃO
Dormindo de barriga para cima por 30 dias.
Evitar levantar os braços acima da cabeça por 15 dias.
Não dormir de lado por 30 dias.

ATIVIDADES
Sem esforço com os braços por 3 semanas.
Academia: retorno com orientação médica após 30-45 dias.
Natação: somente após 45 dias.

CICATRIZAÇÃO
As cicatrizes ficam em local discreto (sulco mamário ou região periareolar).
Proteger do sol por 12 meses.
Massagem cicatricial após liberação médica.`,
      materiais: `Sutiã cirúrgico sem aro (tamanho a ser definido com a equipe)
Gaze estéril
Micropore
Antibiótico conforme prescrição
Analgésico conforme prescrição`,
      complementares: 'Abdominoplastia, Lipoaspiração, Mastopexia',
    },
  })

  const procRitidoplastia = await prisma.procedimento.upsert({
    where: { id: 'proc-ritidoplastia' },
    update: {},
    create: {
      id: 'proc-ritidoplastia',
      clinicId: clinic.id,
      hospitalId: hospMoinhos.id,
      nome: 'Ritidoplastia (Lifting Facial)',
      categoria: 'Facial',
      duracaoMin: 300,
      anestesia: 'Geral',
      valorBase: 35000,
      internacao: 'Hospital (1 noite)',
      recuperacaoDias: 21,
      lembrete: 'Proteja a face do sol por 30 dias. Evite expressões exageradas nas primeiras semanas.',
      descricao:
        'A ritidoplastia é o procedimento mais completo de rejuvenescimento facial, corrigindo flacidez da pele, jowls (papada lateral) e pescoço, com resultado harmonioso e natural.',
      orientacoesPre: `Jejum completo de 8 horas.
Suspender AAS, anti-inflamatórios e anticoagulantes conforme orientação médica.
Lavar o cabelo antes — não poderá lavar após cirurgia.
Não usar maquiagem ou produtos capilares.
Acompanhante obrigatório para estadia de 1 noite.`,
      orientacoesPos: `Manter cabeça elevada por 7-10 dias.
Compressas de gelo nas primeiras 48h.
Não realizar esforços ou movimentos bruscos com a cabeça.
Dieta pastosa por 5-7 dias.
Retorno em 7 dias para retirada de pontos.
Sem sol direto na face por 30 dias.`,
      materiais: `Compressas de gaze estéril
Clorexidina aquosa
Faixa elástica facial (faixa de contenção)
Analgésico e antibiótico conforme prescrição
Protetor solar FPS 50+`,
      complementares: 'Blefaroplastia, Rinoplastia, Preenchimento facial',
    },
  })

  const procLipo = await prisma.procedimento.upsert({
    where: { id: 'proc-lipoaspiracao' },
    update: {},
    create: {
      id: 'proc-lipoaspiracao',
      clinicId: clinic.id,
      hospitalId: hospVenancio.id,
      nome: 'Lipoaspiração',
      categoria: 'Corporal',
      duracaoMin: 180,
      anestesia: 'Geral ou Raqui + Sedação',
      valorBase: 18000,
      internacao: 'Day Hospital',
      recuperacaoDias: 14,
      lembrete: 'Cinta abdominal obrigatória por 30 dias. Evite sal e alimentos inflamatórios nas primeiras semanas.',
      descricao:
        'A lipoaspiração remove depósitos de gordura localizados resistentes a dieta e exercício, contornando e esculpindo a silhueta com alta precisão.',
      orientacoesPre: `Estar próximo ao peso estável.
Jejum de 8 horas completo.
Suspender AAS/anti-inflamatórios 10 dias antes.
Depilar as áreas a serem tratadas alguns dias antes.
Vestimenta: usar roupa folgada para retornar para casa.`,
      orientacoesPos: `Usar cinta de compressão continuamente por 30 dias.
Edema é normal e pode durar 3-6 meses — o resultado final é visto gradualmente.
Drenagem linfática: iniciar em 48-72h conforme orientação.
Sem academia por 30 dias.
Alimentação sem sódio e anti-inflamatória nas primeiras 2 semanas.`,
      materiais: `Cinta de compressão
Gaze estéril
Antibiótico conforme prescrição
Analgésico conforme prescrição
Meia calça de compressão (se indicada)`,
      complementares: 'Abdominoplastia, Mamoplastia',
    },
  })

  console.log('✓ Procedimentos criados')

  // ─── Paciente Demo ────────────────────────────────────────────────────────
  const pacienteHash = await bcrypt.hash('apice2026', 12)
  const fernandaUser = await prisma.user.upsert({
    where: { email: 'fernanda@email.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      nome: 'Fernanda Costa',
      email: 'fernanda@email.com',
      senhaHash: pacienteHash,
      role: 'patient',
      telefone: '(51) 99876-5432',
    },
  })

  const cirurgiaDate = new Date()
  cirurgiaDate.setDate(cirurgiaDate.getDate() + 12)
  cirurgiaDate.setHours(7, 30, 0, 0)

  let fernanda = await prisma.paciente.findUnique({ where: { userId: fernandaUser.id } })
  if (!fernanda) {
    fernanda = await prisma.paciente.create({
      data: {
        clinicId: clinic.id,
        userId: fernandaUser.id,
        procedimentoId: procRino.id,
        medicoId: medBervian.id,
        status: 'pre_op',
        dataCirurgia: cirurgiaDate,
        horaCirurgia: '07:30',
        valor: 22000,
        scoreEngajamento: 78,
      },
    })
  }

  // Jornada da Fernanda
  const jornadaEtapas = [
    { tipo: 'consulta', label: 'Consulta realizada', status: 'done', ordem: 1, data: '15/05/2026', detalhe: 'Consulta de avaliação com Dr. Bervian. Procedimento aprovado.' },
    { tipo: 'confirmacao', label: 'Procedimento confirmado', status: 'done', ordem: 2, data: '20/05/2026', detalhe: 'Contrato assinado e data cirúrgica confirmada.' },
    { tipo: 'exames', label: 'Exames pré-operatórios', status: 'done', ordem: 3, data: '28/05/2026', detalhe: 'Hemograma, coagulograma, ECG — todos dentro do normal.' },
    { tipo: 'docs', label: 'Documentos assinados', status: 'done', ordem: 4, data: '01/06/2026', detalhe: 'Termos de consentimento cirúrgico e anestesia assinados.' },
    { tipo: 'prep', label: 'Preparação pré-cirúrgica', status: 'active', ordem: 5, data: null, detalhe: 'Siga as orientações pré-operatórias. Cumpra o checklist completo.' },
    { tipo: 'internacao', label: 'Internação', status: 'pending', ordem: 6, data: null, detalhe: 'Hospital Moinhos de Vento — Rua Ramiro Barcelos, 910. Bloco B, 3º andar. Entrada às 06:30h.' },
    { tipo: 'cirurgia', label: 'Cirurgia', status: 'pending', ordem: 7, data: null, detalhe: 'Rinoplastia Primária com Dr. Fabrício Bervian. Duração estimada: 3 horas.' },
    { tipo: 'pos', label: 'Pós-operatório', status: 'pending', ordem: 8, data: null, detalhe: 'Acompanhamento pós-operatório com retornos em 7 e 30 dias.' },
  ]

  for (const etapa of jornadaEtapas) {
    await prisma.jornadaEtapa.upsert({
      where: { id: `jornada-fernanda-${etapa.tipo}` },
      update: {},
      create: {
        id: `jornada-fernanda-${etapa.tipo}`,
        pacienteId: fernanda.id,
        ...etapa,
      },
    })
  }

  // Documentos da Fernanda
  const documentos = [
    { tipo: 'consentimento', titulo: 'Termo de Consentimento Cirúrgico', status: 'assinado', conteudo: 'Eu, Fernanda Costa, declaro estar ciente de todos os riscos, benefícios e alternativas ao procedimento de Rinoplastia Primária a ser realizado pelo Dr. Fabrício Bervian, CRM/RS 22345, e consinto livre e voluntariamente com a realização do mesmo.' },
    { tipo: 'anestesia', titulo: 'Termo de Anestesia Geral', status: 'assinado', conteudo: 'Declaro estar ciente sobre o procedimento anestésico a ser realizado, seus riscos e benefícios, e autorizo sua execução pela equipe de anestesiologia.' },
    { tipo: 'orientacoes_pre', titulo: 'Orientações Pré-Operatórias', status: 'disponivel', conteudo: 'Jejum de 8 horas para sólidos. Água pura pode ser ingerida até 4 horas antes. Banho com sabonete antisséptico (Clorexidina 2%) na noite anterior e na manhã da cirurgia. Roupas confortáveis e folgadas, abertas na frente. Suspender aspirina 10 dias antes. Acompanhante adulto obrigatório.' },
    { tipo: 'receita_pre', titulo: 'Receita Pré-Cirúrgica', status: 'disponivel', conteudo: 'PRESCRIÇÃO PRÉ-OPERATÓRIA\n\nDr. Fabrício Bervian — CRM/RS 22345\n\n1. Omeprazol 20mg — 1 comprimido em jejum na manhã da cirurgia\n2. Dexametasona 4mg — 1 comprimido 12h antes da cirurgia\n3. Metronidazol 400mg — 1 comprimido na noite anterior' },
    { tipo: 'orientacoes_pos', titulo: 'Orientações Pós-Operatórias', status: 'pendente', conteudo: null },
    { tipo: 'receita_pos', titulo: 'Receita Pós-Operatória', status: 'pendente', conteudo: null },
    { tipo: 'internacao', titulo: 'Confirmação de Internação', status: 'disponivel', conteudo: 'CONFIRMAÇÃO DE INTERNAÇÃO\n\nHospital: Hospital Moinhos de Vento\nEndereço: Rua Ramiro Barcelos, 910 — Porto Alegre/RS\nData: conforme sua cirurgia agendada\nHorário de entrada: 06:30h\nLocal: Centro Cirúrgico — Bloco B, 3º andar\nTelefone: (51) 3314-3434\n\nDocumentos necessários: RG/CPF e todos os exames pré-operatórios.' },
  ]

  for (const doc of documentos) {
    await prisma.documento.upsert({
      where: { id: `doc-fernanda-${doc.tipo}` },
      update: {},
      create: {
        id: `doc-fernanda-${doc.tipo}`,
        pacienteId: fernanda.id,
        ...doc,
      },
    })
  }

  // Checklist da Fernanda
  const checklistItems = [
    { texto: 'Exames pré-operatórios entregues à clínica', janela: 'T72', ordem: 1 },
    { texto: 'Jejum programado — nada após as 23h', janela: 'T72', ordem: 2 },
    { texto: 'Protetor nasal rígido pós-operatório disponível', janela: 'T72', ordem: 3 },
    { texto: 'Micropore hipoalergênico (3M) disponível', janela: 'T72', ordem: 4 },
    { texto: 'Soro fisiológico 0,9% — caixa com ampolas', janela: 'T72', ordem: 5 },
    { texto: 'Cotonetes estéreis disponíveis', janela: 'T72', ordem: 6 },
    { texto: 'Compressas de gaze estéril', janela: 'T72', ordem: 7 },
    { texto: 'Clorexidina solução degermante 2%', janela: 'T72', ordem: 8 },
    { texto: 'Documentação completa (RG/CPF + exames)', janela: 'T24', ordem: 9 },
    { texto: 'Acompanhante confirmado', janela: 'T24', ordem: 10 },
    { texto: 'Suspensão de AAS/anti-inflamatórios confirmada (10 dias)', janela: 'T24', ordem: 11 },
    { texto: 'Remédios pré-operatórios tomados conforme prescrição', janela: 'T24', ordem: 12 },
    { texto: 'Banho com sabonete antisséptico (Clorexidina 2%)', janela: 'T2', ordem: 13 },
    { texto: 'Sem maquiagem, esmalte ou acessórios', janela: 'T2', ordem: 14 },
    { texto: 'Roupa confortável e folgada (aberta na frente)', janela: 'T2', ordem: 15 },
    { texto: 'Lentes de contato removidas', janela: 'T2', ordem: 16 },
  ]

  for (const item of checklistItems) {
    await prisma.checklistItem.upsert({
      where: { id: `checklist-fernanda-${item.ordem}` },
      update: {},
      create: {
        id: `checklist-fernanda-${item.ordem}`,
        pacienteId: fernanda.id,
        feito: item.ordem <= 3,
        ...item,
      },
    })
  }

  // Mensagens demo
  await prisma.mensagem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'msg-1',
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'clinic',
        conteudo: 'Olá, Fernanda! Seja bem-vinda à Plataforma Ápice. Aqui você acompanhará toda a sua jornada até a cirurgia e o pós-operatório. Qualquer dúvida, estamos à disposição. 🌿',
        tipo: 'manual',
        pendienteAprovacao: false,
        sentimentoScore: 0.9,
        sentimentoLabel: 'positivo',
      },
      {
        id: 'msg-2',
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'patient',
        conteudo: 'Oi! Obrigada! Fiquei com uma dúvida: posso tomar água até que horas antes da cirurgia?',
        tipo: 'auto',
        pendienteAprovacao: false,
        sentimentoScore: 0.7,
        sentimentoLabel: 'positivo',
      },
      {
        id: 'msg-3',
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'ai',
        conteudo: 'O jejum deve ser de 8 horas para sólidos e líquidos espessos. Água pura pode ser ingerida até 4 horas antes. Nada após as 23h do dia anterior. Se tiver dúvida sobre algum alimento específico, nossa equipe pode esclarecer. 🌿',
        tipo: 'auto',
        pendienteAprovacao: false,
        sentimentoScore: 0.8,
        sentimentoLabel: 'positivo',
      },
      {
        id: 'msg-4',
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'patient',
        conteudo: 'Perfeito! E sobre os meus óculos, posso usar normalmente depois?',
        tipo: 'auto',
        pendienteAprovacao: false,
        sentimentoScore: 0.75,
        sentimentoLabel: 'positivo',
      },
      {
        id: 'msg-5',
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'ai',
        conteudo: 'Óculos comuns não podem ser apoiados no nariz por 6 semanas após a rinoplastia. Você pode substituir por óculos presos à testa com fita. Lentes de contato podem ser usadas normalmente. Após a liberação médica, os óculos voltam ao uso normal. 🌿',
        tipo: 'auto',
        pendienteAprovacao: false,
        sentimentoScore: 0.8,
        sentimentoLabel: 'positivo',
      },
    ],
  })

  console.log('✓ Paciente demo criado (Fernanda Costa)')

  // ─── Leads para Pipeline ──────────────────────────────────────────────────
  const leadsData = [
    { nome: 'Ana Beatriz Souza', telefone: '(51) 99111-1111', email: 'ana@email.com', procedimentoId: procRino.id, medicoId: medBervian.id, estagio: 'lead', valorEstimado: 22000, obs: 'Interesse em rinoplastia — veio por indicação de outra paciente.' },
    { nome: 'Carolina Mendes', telefone: '(51) 99222-2222', email: 'carol@email.com', procedimentoId: procMamoplastia.id, medicoId: medLarsen.id, estagio: 'lead', valorEstimado: 24000, obs: 'Contato pelo Instagram — interesse em prótese de mama.' },
    { nome: 'Daniela Oliveira', telefone: '(51) 99333-3333', email: null, procedimentoId: procAbdominoplastia.id, medicoId: medLarsen.id, estagio: 'consulta', valorEstimado: 28000, obs: 'Consulta agendada para semana que vem.' },
    { nome: 'Elena Rodrigues', telefone: '(51) 99444-4444', email: 'elena@email.com', procedimentoId: procBlefaroplastia.id, medicoId: medBervian.id, estagio: 'consulta', valorEstimado: 14000, obs: 'Quer blefaroplastia superior + inferior.' },
    { nome: 'Flávia Martins', telefone: '(51) 99555-5555', email: 'flavia@email.com', procedimentoId: procLipo.id, medicoId: medLarsen.id, estagio: 'proposta', valorEstimado: 18000, obs: 'Proposta enviada. Aguardando retorno sobre financiamento.' },
    { nome: 'Gabriela Santos', telefone: '(51) 99666-6666', email: null, procedimentoId: procRitidoplastia.id, medicoId: medBervian.id, estagio: 'proposta', valorEstimado: 35000, obs: 'Muito interessada. Quer combinar com blefaroplastia.' },
    { nome: 'Helena Costa', telefone: '(51) 99777-7777', email: 'helena@email.com', procedimentoId: procMamoplastia.id, medicoId: medLarsen.id, estagio: 'fechamento', valorEstimado: 24000, obs: 'Assinou contrato. Aguardando confirmação da data.' },
    { nome: 'Isabela Ferreira', telefone: '(51) 99888-8888', email: 'isa@email.com', procedimentoId: procAbdominoplastia.id, medicoId: medLarsen.id, estagio: 'fechamento', valorEstimado: 46000, obs: 'Abdominoplastia + lipoaspiração. Datas já em negociação.' },
  ]

  for (let i = 0; i < leadsData.length; i++) {
    await prisma.lead.upsert({
      where: { id: `lead-${i + 1}` },
      update: {},
      create: {
        id: `lead-${i + 1}`,
        clinicId: clinic.id,
        ultimoContato: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
        ...leadsData[i],
      },
    })
  }

  console.log('✓ Leads criados')

  // ─── Cirurgias Históricas (para dashboard) ────────────────────────────────
  const cirurgiasHistoricas = []
  const now = new Date()
  for (let m = 5; m >= 0; m--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 15)
    const count = Math.floor(Math.random() * 6) + 4

    for (let c = 0; c < count; c++) {
      const procedimentos = [procRino, procBlefaroplastia, procAbdominoplastia, procMamoplastia, procLipo, procRitidoplastia]
      const proc = procedimentos[c % procedimentos.length]
      const medico = c % 2 === 0 ? medBervian : medLarsen
      const hospital = c % 3 === 0 ? hospMoinhos : c % 3 === 1 ? hospSaoLucas : hospVenancio
      const valor = proc.valorBase * (0.9 + Math.random() * 0.2)

      cirurgiasHistoricas.push({
        id: `cirurgia-hist-${m}-${c}`,
        clinicId: clinic.id,
        pacienteId: fernanda.id,
        procedimentoId: proc.id,
        medicoId: medico.id,
        hospitalId: hospital.id,
        data: monthDate,
        horaInicio: '07:30',
        duracaoMin: proc.duracaoMin,
        valor: Math.round(valor),
        status: 'realizada',
      })
    }
  }

  // Cirurgia futura da Fernanda
  cirurgiasHistoricas.push({
    id: 'cirurgia-fernanda-proxima',
    clinicId: clinic.id,
    pacienteId: fernanda.id,
    procedimentoId: procRino.id,
    medicoId: medBervian.id,
    hospitalId: hospMoinhos.id,
    data: cirurgiaDate,
    horaInicio: '07:30',
    duracaoMin: 180,
    valor: 22000,
    status: 'agendada',
  })

  for (const cir of cirurgiasHistoricas) {
    await prisma.cirurgia.upsert({
      where: { id: cir.id },
      update: {},
      create: cir,
    })
  }

  console.log('✓ Cirurgias históricas criadas')
  console.log('\n✅ Seed completo!')
  console.log('\n📧 Credenciais de acesso:')
  console.log('   Admin:    admin@bervianlarsen.com.br / apice2026')
  console.log('   Dr. Bervian: fabricio@bervianlarsen.com.br / apice2026')
  console.log('   Paciente: fernanda@email.com / apice2026')
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
