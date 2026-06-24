import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Plataforma Ápice — Bervian & Larsen...')

  // Clean up in dependency order
  await prisma.mensagem.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.jornadaEtapa.deleteMany()
  await prisma.cirurgia.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.paciente.deleteMany()
  await prisma.respostaIA.deleteMany()
  await prisma.procedimentoVideo.deleteMany()
  await prisma.procedimento.deleteMany()
  await prisma.medico.deleteMany()
  await prisma.hospital.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinic.deleteMany()

  // ─── Clinic ───────────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.create({
    data: {
      nome: 'Bervian & Larsen',
      slug: 'bervian-larsen',
      corPrimaria: '#8B6914',
      corSecundaria: '#0E0D0C',
      plano: 'pro',
    },
  })

  const senhaHash = await bcrypt.hash('apice2026', 10)

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      nome: 'Administrador Ápice',
      email: 'admin@bervianlarsen.com.br',
      senhaHash,
      role: 'clinic_admin',
    },
  })

  const fabricioUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      nome: 'Dr. Fabrício Bervian',
      email: 'fabricio@bervianlarsen.com.br',
      senhaHash,
      role: 'doctor',
    },
  })

  const guilhermeUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      nome: 'Dr. Guilherme Larsen',
      email: 'guilherme@bervianlarsen.com.br',
      senhaHash,
      role: 'doctor',
    },
  })

  const fernandaUser = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      nome: 'Fernanda Costa',
      email: 'fernanda@email.com',
      senhaHash,
      role: 'patient',
    },
  })

  // ─── Medicos ──────────────────────────────────────────────────────────────
  const bervian = await prisma.medico.create({
    data: {
      clinicId: clinic.id,
      userId: fabricioUser.id,
      crm: '18452',
      especialidade: 'Cirurgia Plástica Facial',
      formacao: 'UFRGS · Residência em Cirurgia Plástica no HC-SP · Fellowship em Rinoplastia em Paris',
      bio: 'Especialista em cirurgia facial e rinoplastia, com formação internacional. Referência em Porto Alegre para procedimentos de rejuvenescimento facial e rinoplastia primária e de revisão.',
      agenda: 'Seg Ter Qui',
    },
  })

  const larsen = await prisma.medico.create({
    data: {
      clinicId: clinic.id,
      userId: guilhermeUser.id,
      crm: '22187',
      especialidade: 'Cirurgia Plástica Corporal',
      formacao: 'PUCRS · Residência em Cirurgia Plástica · Membro da SBCP',
      bio: 'Especialista em contorno corporal e cirurgia mamária. Reconhecido pela abordagem natural e pelos resultados harmoniosos em abdominoplastia, mamoplastia e lipoaspiração.',
      agenda: 'Qua Sex',
    },
  })

  // ─── Hospitais ────────────────────────────────────────────────────────────
  const moinhos = await prisma.hospital.create({
    data: {
      clinicId: clinic.id,
      nome: 'Hospital Moinhos de Vento',
      tipo: 'Hospital',
      endereco: 'Rua Ramiro Barcelos, 910',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3314-3000',
      contato: 'Central Cirúrgica',
    },
  })

  const saolucas = await prisma.hospital.create({
    data: {
      clinicId: clinic.id,
      nome: 'Hospital São Lucas da PUCRS',
      tipo: 'Hospital',
      endereco: 'Av. Ipiranga, 6690',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3320-3000',
      contato: 'Unidade Cirúrgica',
    },
  })

  const venancio = await prisma.hospital.create({
    data: {
      clinicId: clinic.id,
      nome: 'Clínica Venâncio Day Hospital',
      tipo: 'Day Hospital',
      endereco: 'Av. Venâncio Aires, 240',
      cidade: 'Porto Alegre/RS',
      telefone: '(51) 3312-5500',
      contato: 'Coordenação',
    },
  })

  // ─── Procedimentos ────────────────────────────────────────────────────────
  const rinoplastia = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: moinhos.id,
      nome: 'Rinoplastia Primária',
      categoria: 'Facial',
      duracaoMin: 180,
      anestesia: 'Geral',
      valorBase: 22000,
      internacao: 'Day Hospital',
      recuperacaoDias: 14,
      lembrete: 'Lembre-se: o uso de óculos é proibido por 30 dias após a cirurgia.',
      descricao: 'A rinoplastia é um dos procedimentos cirúrgicos mais complexos da cirurgia plástica, exigindo técnica apurada e senso estético refinado. O objetivo é harmonizar o nariz com os demais traços do rosto, respeitando a identidade única de cada paciente.',
      orientacoesPre: `Jejum de 8 horas para sólidos. Água pode ser ingerida até 4h antes da cirurgia.
Banho com sabonete antisséptico na noite anterior e na manhã da cirurgia.
Roupas confortáveis e folgadas, sem maquiagem, esmalte ou acessórios.
Acompanhante adulto obrigatório — deve permanecer no hospital durante o procedimento.
Documentos obrigatórios: RG/CPF e todos os exames pré-operatórios.
Suspender AAS, anticoagulantes e vitamina E por 7 dias antes — apenas com orientação médica.
Não fumar por pelo menos 4 semanas antes da cirurgia.
Interromper uso de contraceptivos orais conforme orientação médica.`,
      orientacoesPos: `Repouso relativo por 7 dias — evitar esforços físicos e exposição solar.
Dormir com cabeceira elevada a 30° por 2 semanas.
Aplicar compressas frias (não geladas) nas primeiras 48 horas.
Uso de óculos completamente proibido por 30 dias.
Retorno em 7 dias para avaliação e retirada de pontos.
Evitar atividades físicas por 30 dias.
Evitar exposição solar direta por 90 dias.
Usar protetor solar FPS 50 após liberação médica.
Possíveis sintomas normais: inchaço, hematomas e obstrução nasal por até 3-4 semanas.`,
      materiais: `Malha compressora nasal
Fita micropore bege 2,5cm
Gelo gel reutilizável (2 unidades)
Suporte de cabeça ergonômico
Analgésico conforme prescrição
Antibiótico conforme prescrição
Soro fisiológico 0,9% para lavagem nasal
Antiedematoso conforme prescrição`,
      complementares: 'Blefaroplastia, Lipoaspiração de mento',
    },
  })

  await prisma.procedimentoVideo.createMany({
    data: [
      {
        procedimentoId: rinoplastia.id,
        titulo: 'Entendendo a Rinoplastia',
        url: 'https://example.com/videos/rino-intro',
        duracao: '8:24',
        descricao: 'Entenda como funciona a rinoplastia primária, as técnicas utilizadas pelo Dr. Bervian e o que esperar do resultado.',
        ordem: 1,
      },
      {
        procedimentoId: rinoplastia.id,
        titulo: 'Pós-Operatório: O que Esperar',
        url: 'https://example.com/videos/rino-pos',
        duracao: '6:12',
        descricao: 'Um guia completo sobre o pós-operatório da rinoplastia: inchaço, hematomas, cuidados essenciais e evolução semana a semana.',
        ordem: 2,
      },
    ],
  })

  await prisma.respostaIA.createMany({
    data: [
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'jejum,comer,beber,sólido,água,alimentar,alimentação',
        resposta: 'O jejum deve ser de 8 horas para sólidos. Água pode ser ingerida até 4 horas antes da cirurgia. Nada após 23h do dia anterior. 🌿',
      },
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'óculos,óculo,usar,colocar,enxergar,visão,lente',
        resposta: 'O uso de óculos está proibido por 30 dias após a rinoplastia para não pressionar o nariz em cicatrização. Lentes de contato podem ser utilizadas a partir do 3º dia com aprovação médica.',
      },
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'inchaço,hematoma,roxo,azul,edema,inchar,inchado',
        resposta: 'Inchaço e hematomas são completamente normais após a rinoplastia e atingem o pico nos primeiros 2-3 dias. Compressas frias nas primeiras 48h ajudam muito. A maior parte melhora em 2 semanas. 🌿',
      },
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'hospital,internação,chegar,horário,entrada,endereço,bloco,local',
        resposta: 'Sua internação está confirmada no Hospital Moinhos de Vento — Rua Ramiro Barcelos, 910, Bom Fim, Porto Alegre. Apresente-se às 06h30 no Bloco Cirúrgico. Leve RG/CPF e todos os exames. 🌿',
      },
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'remédio,medicamento,tomar,comprimido,suspender,anticoagulante,aspirina,aas,vitamina',
        resposta: 'Medicamentos de uso contínuo precisam de avaliação individual. Anticoagulantes, AAS e vitamina E devem ser suspensos 7 dias antes — apenas com orientação médica. Nunca suspenda qualquer medicação sem autorização.',
      },
      {
        procedimentoId: rinoplastia.id,
        palavrasChave: 'fumar,cigarro,tabaco,fumo,parar,vício',
        resposta: 'Fumar prejudica significativamente a cicatrização e aumenta o risco de complicações. É essencial parar de fumar por pelo menos 4 semanas antes e manter após a cirurgia. 🌿',
      },
    ],
  })

  const blefaroplastia = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: moinhos.id,
      nome: 'Blefaroplastia',
      categoria: 'Facial',
      duracaoMin: 90,
      anestesia: 'Sedação',
      valorBase: 12000,
      internacao: 'Day Hospital',
      recuperacaoDias: 10,
      lembrete: 'Remova maquiagem e esmalte completamente antes da cirurgia.',
      descricao: 'A blefaroplastia rejuvenesce o olhar removendo o excesso de pele e gordura das pálpebras, resultando em um olhar mais descansado, jovem e expressivo.',
      orientacoesPre: `Jejum de 6 horas para sólidos. Água até 3h antes.
Remover toda a maquiagem e esmalte antes de vir ao hospital.
Retirar lentes de contato na véspera.
Não usar creme ou produto em torno dos olhos.
Documentos: RG/CPF e exames pré-operatórios.
Acompanhante obrigatório.`,
      orientacoesPos: `Compressas frias nas primeiras 24-48h.
Manter cabeceira elevada ao dormir por 5 dias.
Evitar esforço visual intenso (TV, celular) por 3 dias.
Colírio lubrificante conforme prescrição.
Proteção solar na área dos olhos após cicatrização.
Retorno em 5 dias para reavaliação.`,
      materiais: `Colírio lubrificante prescrito
Compressas estéreis
Fita micropore para fixação
Óculos escuros (usar na saída do hospital)`,
    },
  })

  await prisma.procedimentoVideo.create({
    data: {
      procedimentoId: blefaroplastia.id,
      titulo: 'Blefaroplastia: Rejuvenescimento do Olhar',
      url: 'https://example.com/videos/blefaro-intro',
      duracao: '5:30',
      descricao: 'Dr. Fabrício Bervian explica as técnicas de blefaroplastia superior e inferior, e como o procedimento transforma o olhar.',
      ordem: 1,
    },
  })

  const abdominoplastia = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: saolucas.id,
      nome: 'Abdominoplastia',
      categoria: 'Corporal',
      duracaoMin: 210,
      anestesia: 'Geral',
      valorBase: 18000,
      internacao: '24h',
      recuperacaoDias: 21,
      lembrete: 'Use a cinta abdominal 24h por dia nas primeiras 4 semanas.',
      descricao: 'A abdominoplastia remove o excesso de pele e gordura abdominal e corrige a diástase dos músculos retos, restaurando a firmeza e a definição da região abdominal.',
      orientacoesPre: `Jejum de 8 horas para sólidos e 4 horas para líquidos.
Banho antisséptico na véspera e no dia da cirurgia.
Tricotomia pubiana conforme orientação.
Suspender anticoagulantes e AAS 7 dias antes.
Não fumar por 4 semanas antes.
Acompanhante obrigatório. Internação de 24h.`,
      orientacoesPos: `Uso obrigatório de cinta abdominal 24h/dia por 4 semanas.
Repouso com leve flexão do tronco nas primeiras semanas.
Curativo a ser trocado conforme orientação.
Retorno em 7 dias para avaliação.
Sem atividade física por 60 dias.
Sem banho de sol por 6 meses.
Drenagem linfática recomendada a partir do 3º dia.`,
      materiais: `Cinta abdominal alta (tamanho M)
Curativos adesivos estéreis
Dreno de sucção (instalado na cirurgia)
Gel cicatrizante prescrito
Meias de compressão`,
    },
  })

  await prisma.procedimentoVideo.create({
    data: {
      procedimentoId: abdominoplastia.id,
      titulo: 'Abdominoplastia Completa',
      url: 'https://example.com/videos/abdom-intro',
      duracao: '10:15',
      descricao: 'Entenda o processo completo da abdominoplastia: desde a consulta até a recuperação, com dicas essenciais do Dr. Larsen.',
      ordem: 1,
    },
  })

  const mamoplastia = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: venancio.id,
      nome: 'Mamoplastia de Aumento',
      categoria: 'Mamário',
      duracaoMin: 150,
      anestesia: 'Geral',
      valorBase: 20000,
      internacao: 'Day Hospital',
      recuperacaoDias: 14,
      lembrete: 'Use o sutiã cirúrgico 24h por dia por 60 dias.',
      descricao: 'A mamoplastia de aumento utiliza próteses de silicone de alta tecnologia para proporcionar maior volume, melhorar a simetria e restaurar a autoestima. A escolha da prótese é personalizada para cada paciente.',
      orientacoesPre: `Jejum de 8 horas.
Banho antisséptico na noite anterior e manhã da cirurgia.
Não usar desodorante, cremes ou perfume.
Suspender anticoagulantes conforme orientação.
Acompanhante obrigatório.`,
      orientacoesPos: `Sutiã cirúrgico sem aros 24h/dia por 60 dias.
Dormir de costas com leve elevação do tronco por 3 semanas.
Não elevar os braços acima da cabeça na primeira semana.
Sem atividade física por 30 dias.
Massagem nas próteses conforme orientação médica.
Retorno em 7 dias.`,
      materiais: `Sutiã cirúrgico (tamanho a confirmar)
Compressa estéril
Gel cicatrizante`,
    },
  })

  await prisma.procedimentoVideo.create({
    data: {
      procedimentoId: mamoplastia.id,
      titulo: 'Mamoplastia: Tipos de Próteses e Técnicas',
      url: 'https://example.com/videos/mamo-intro',
      duracao: '7:42',
      descricao: 'Dr. Guilherme Larsen explica os tipos de próteses disponíveis, as vias de acesso cirúrgico e como escolher o tamanho ideal para cada perfil.',
      ordem: 1,
    },
  })

  const ritidoplastia = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: moinhos.id,
      nome: 'Ritidoplastia (Facelift)',
      categoria: 'Facial',
      duracaoMin: 240,
      anestesia: 'Geral',
      valorBase: 35000,
      internacao: '24h',
      recuperacaoDias: 21,
      lembrete: 'Suspenda anticoagulantes e suplementos 10 dias antes.',
      descricao: 'A ritidoplastia é o procedimento mais efetivo para rejuvenescimento facial global, corrigindo ptoses, flacidez e sulcos profundos com resultados naturais e duradouros.',
      orientacoesPre: `Jejum de 8 horas.
Suspender AAS, anticoagulantes e suplementos 10 dias antes.
Não fumar por 8 semanas antes.
Banho antisséptico na véspera e no dia.`,
      orientacoesPos: `Repouso de 7 a 10 dias.
Curativo compressivo por 24-48h.
Dieta pastosa nos primeiros 3 dias.
Evitar esforço e exposição solar por 90 dias.`,
      materiais: `Curativo compressivo
Fita elástica
Protetor solar FPS 50+`,
    },
  })

  const lipoaspiracao = await prisma.procedimento.create({
    data: {
      clinicId: clinic.id,
      hospitalId: saolucas.id,
      nome: 'Lipoaspiração',
      categoria: 'Corporal',
      duracaoMin: 180,
      anestesia: 'Geral',
      valorBase: 15000,
      internacao: 'Day Hospital',
      recuperacaoDias: 14,
      lembrete: 'A cinta modeladora é fundamental — use-a 24h por dia.',
      descricao: 'A lipoaspiração remove depósitos localizados de gordura que resistem à dieta e exercícios, remodelando o contorno corporal de forma precisa e segura.',
      orientacoesPre: `Jejum de 8 horas.
Banho antisséptico na véspera e no dia.
Cinta modeladora selecionada previamente.
Não fumar por 4 semanas antes.`,
      orientacoesPos: `Cinta modeladora 24h/dia por 60 dias.
Drenagem linfática a partir do 3º dia (mínimo 10 sessões).
Sem atividade física por 30 dias.
Retorno em 7 dias.`,
      materiais: `Cinta modeladora (tamanho M)
Meias de compressão
Gel para massagem`,
    },
  })

  // ─── Paciente demo (Fernanda) ──────────────────────────────────────────────
  const dataCirurgia = new Date()
  dataCirurgia.setDate(dataCirurgia.getDate() + 10)

  const fernanda = await prisma.paciente.create({
    data: {
      clinicId: clinic.id,
      userId: fernandaUser.id,
      procedimentoId: rinoplastia.id,
      medicoId: bervian.id,
      status: 'pre_op',
      dataCirurgia,
      horaCirurgia: '07:00',
      valor: 22000,
      scoreEngajamento: 72,
    },
  })

  // Jornada
  await prisma.jornadaEtapa.createMany({
    data: [
      { pacienteId: fernanda.id, tipo: 'consulta', label: 'Consulta realizada', status: 'done', data: '15/05/2026', ordem: 1, detalhe: 'Primeira consulta com Dr. Bervian. Definição do procedimento e expectativas.' },
      { pacienteId: fernanda.id, tipo: 'confirmacao', label: 'Procedimento confirmado', status: 'done', data: '20/05/2026', ordem: 2, detalhe: 'Rinoplastia Primária confirmada. Pagamento realizado.' },
      { pacienteId: fernanda.id, tipo: 'exames', label: 'Exames pré-operatórios', status: 'done', data: '28/05/2026', ordem: 3, detalhe: 'Todos os exames solicitados entregues e aprovados pelo anestesista.' },
      { pacienteId: fernanda.id, tipo: 'docs', label: 'Documentos assinados', status: 'done', data: '01/06/2026', ordem: 4, detalhe: 'Termos de consentimento cirúrgico e anestésico assinados.' },
      { pacienteId: fernanda.id, tipo: 'prep', label: 'Preparação pré-cirúrgica', status: 'active', ordem: 5, detalhe: 'Siga todas as orientações pré-operatórias: jejum, banho antisséptico, suspensão de medicamentos.' },
      { pacienteId: fernanda.id, tipo: 'internacao', label: 'Internação', status: 'pending', ordem: 6, detalhe: `Hospital Moinhos de Vento — Rua Ramiro Barcelos, 910. Chegada às 06h30.` },
      { pacienteId: fernanda.id, tipo: 'cirurgia', label: 'Cirurgia', status: 'pending', ordem: 7, detalhe: 'Rinoplastia Primária com Dr. Fabrício Bervian. Duração estimada: 3 horas.' },
      { pacienteId: fernanda.id, tipo: 'pos', label: 'Pós-operatório', status: 'pending', ordem: 8, detalhe: 'Acompanhamento pós-cirúrgico. Retorno em 7 dias para avaliação e retirada de pontos.' },
    ],
  })

  // Documentos
  await prisma.documento.createMany({
    data: [
      { pacienteId: fernanda.id, tipo: 'consentimento', titulo: 'Termo de Consentimento Cirúrgico', status: 'assinado' },
      { pacienteId: fernanda.id, tipo: 'anestesia', titulo: 'Termo de Consentimento para Anestesia Geral', status: 'assinado' },
      { pacienteId: fernanda.id, tipo: 'orientacoes_pre', titulo: 'Orientações Pré-Operatórias', conteudo: rinoplastia.orientacoesPre, status: 'disponivel' },
      { pacienteId: fernanda.id, tipo: 'orientacoes_pos', titulo: 'Orientações Pós-Operatórias', conteudo: rinoplastia.orientacoesPos, status: 'pendente', liberadoEm: dataCirurgia },
      { pacienteId: fernanda.id, tipo: 'receita_pre', titulo: 'Receita Pré-Cirúrgica', conteudo: 'Amoxicilina 500mg — 1 comprimido por dia por 7 dias (iniciar 1 dia antes da cirurgia)\nDexametasona 8mg — conforme orientação médica\nCetoprofeno 100mg — conforme necessidade para dor', status: 'disponivel' },
      { pacienteId: fernanda.id, tipo: 'receita_pos', titulo: 'Receita Pós-Operatória', status: 'pendente', liberadoEm: dataCirurgia },
      { pacienteId: fernanda.id, tipo: 'internacao', titulo: 'Confirmação de Internação', conteudo: `Hospital Moinhos de Vento\nRua Ramiro Barcelos, 910 — Bom Fim, Porto Alegre/RS\n\nData: ${dataCirurgia.toLocaleDateString('pt-BR')}\nHorário de chegada: 06h30\nBloco Cirúrgico — 3º andar\n\nDocumentos obrigatórios:\n- RG e CPF originais\n- Todos os exames pré-operatórios\n- Lista de medicamentos em uso contínuo`, status: 'disponivel' },
    ],
  })

  // Checklist
  await prisma.checklistItem.createMany({
    data: [
      { pacienteId: fernanda.id, texto: 'Exames pré-operatórios entregues à clínica', janela: 'T72', ordem: 1, feito: true },
      { pacienteId: fernanda.id, texto: 'Malha compressora nasal adquirida', janela: 'T72', ordem: 2, feito: true },
      { pacienteId: fernanda.id, texto: 'Gelo gel reutilizável no freezer', janela: 'T72', ordem: 3, feito: false },
      { pacienteId: fernanda.id, texto: 'Suporte de cabeça ergonômico preparado', janela: 'T72', ordem: 4, feito: false },
      { pacienteId: fernanda.id, texto: 'Acompanhante adulto confirmado', janela: 'T24', ordem: 5, feito: false },
      { pacienteId: fernanda.id, texto: 'Documentação completa separada (RG, CPF, exames)', janela: 'T24', ordem: 6, feito: false },
      { pacienteId: fernanda.id, texto: 'Jejum programado — nada sólido após as 23h', janela: 'T24', ordem: 7, feito: false },
      { pacienteId: fernanda.id, texto: 'Banho com sabonete antisséptico', janela: 'T2', ordem: 8, feito: false },
      { pacienteId: fernanda.id, texto: 'Retirar esmalte de unhas', janela: 'T2', ordem: 9, feito: false },
      { pacienteId: fernanda.id, texto: 'Roupas confortáveis separadas para o dia', janela: 'T2', ordem: 10, feito: false },
    ],
  })

  // Mensagens demo
  await prisma.mensagem.createMany({
    data: [
      {
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'clinic',
        conteudo: 'Olá, Fernanda! Seja muito bem-vinda à Plataforma Ápice. Estamos aqui para acompanhar toda a sua jornada. 🌿',
        tipo: 'manual',
      },
      {
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'patient',
        conteudo: 'Obrigada! Tenho uma dúvida sobre o jejum antes da cirurgia.',
        tipo: 'auto',
      },
      {
        pacienteId: fernanda.id,
        clinicId: clinic.id,
        remetente: 'ai',
        conteudo: 'O jejum deve ser de 8 horas para sólidos. Água pode ser ingerida até 4 horas antes da cirurgia. Nada após 23h do dia anterior. 🌿',
        tipo: 'auto',
      },
    ],
  })

  // ─── Leads ────────────────────────────────────────────────────────────────
  const leadData = [
    { nome: 'Marcela Ribeiro', estagio: 'lead', procedimentoId: rinoplastia.id, medicoId: bervian.id, valorEstimado: 22000 },
    { nome: 'Carolina Mendes', estagio: 'lead', procedimentoId: blefaroplastia.id, medicoId: bervian.id, valorEstimado: 12000 },
    { nome: 'Patrícia Alves', estagio: 'consulta', procedimentoId: abdominoplastia.id, medicoId: larsen.id, valorEstimado: 18000 },
    { nome: 'Juliana Santos', estagio: 'consulta', procedimentoId: mamoplastia.id, medicoId: larsen.id, valorEstimado: 20000 },
    { nome: 'Amanda Ferreira', estagio: 'proposta', procedimentoId: lipoaspiracao.id, medicoId: larsen.id, valorEstimado: 15000 },
    { nome: 'Renata Oliveira', estagio: 'proposta', procedimentoId: rinoplastia.id, medicoId: bervian.id, valorEstimado: 22000 },
    { nome: 'Bianca Torres', estagio: 'proposta', procedimentoId: ritidoplastia.id, medicoId: bervian.id, valorEstimado: 35000 },
    { nome: 'Isabela Souza', estagio: 'fechamento', procedimentoId: mamoplastia.id, medicoId: larsen.id, valorEstimado: 20000, telefone: '(51) 9 9876-5432' },
  ]

  for (const l of leadData) {
    await prisma.lead.create({
      data: {
        clinicId: clinic.id,
        ...l,
        ultimoContato: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  // ─── Cirurgias (históricas para gráficos + futuras) ───────────────────────
  // Realizadas — últimos 6 meses
  const realizadas = [
    { mesesAtras: 5, paciente: 'Ana Lima', proc: rinoplastia.id, medico: bervian.id, hosp: moinhos.id, valor: 22000, dur: 180 },
    { mesesAtras: 5, paciente: 'Sofia Nunes', proc: mamoplastia.id, medico: larsen.id, hosp: venancio.id, valor: 20000, dur: 150 },
    { mesesAtras: 4, paciente: 'Laura Campos', proc: abdominoplastia.id, medico: larsen.id, hosp: saolucas.id, valor: 18000, dur: 210 },
    { mesesAtras: 3, paciente: 'Helena Dias', proc: rinoplastia.id, medico: bervian.id, hosp: moinhos.id, valor: 22000, dur: 180 },
    { mesesAtras: 3, paciente: 'Yasmin Costa', proc: lipoaspiracao.id, medico: larsen.id, hosp: saolucas.id, valor: 15000, dur: 180 },
    { mesesAtras: 2, paciente: 'Beatriz Rocha', proc: ritidoplastia.id, medico: bervian.id, hosp: moinhos.id, valor: 35000, dur: 240 },
  ]

  for (const c of realizadas) {
    const data = new Date()
    data.setMonth(data.getMonth() - c.mesesAtras)
    data.setDate(Math.floor(Math.random() * 20) + 1)

    const userRealizada = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        nome: c.paciente,
        email: `${c.paciente.toLowerCase().replace(/\s/g, '.')}${Date.now()}@example.com`,
        senhaHash,
        role: 'patient',
      },
    })
    const pacienteRealizada = await prisma.paciente.create({
      data: {
        clinicId: clinic.id,
        userId: userRealizada.id,
        procedimentoId: c.proc,
        medicoId: c.medico,
        status: 'alta',
        dataCirurgia: data,
        valor: c.valor,
        scoreEngajamento: Math.floor(Math.random() * 30) + 70,
      },
    })
    await prisma.cirurgia.create({
      data: {
        clinicId: clinic.id,
        pacienteId: pacienteRealizada.id,
        procedimentoId: c.proc,
        medicoId: c.medico,
        hospitalId: c.hosp,
        data,
        horaInicio: '07:30',
        duracaoMin: c.dur,
        valor: c.valor,
        status: 'realizada',
        statusPosOp: 'ok',
      },
    })
  }

  // Cirurgia da Fernanda (agendada)
  await prisma.cirurgia.create({
    data: {
      clinicId: clinic.id,
      pacienteId: fernanda.id,
      procedimentoId: rinoplastia.id,
      medicoId: bervian.id,
      hospitalId: moinhos.id,
      data: dataCirurgia,
      horaInicio: '07:00',
      duracaoMin: 180,
      valor: 22000,
      status: 'agendada',
    },
  })

  // 3 cirurgias futuras agendadas
  const futuras = [
    { diasAte: 5, proc: abdominoplastia.id, medico: larsen.id, hosp: saolucas.id, valor: 18000, dur: 210 },
    { diasAte: 12, proc: mamoplastia.id, medico: larsen.id, hosp: venancio.id, valor: 20000, dur: 150 },
    { diasAte: 20, proc: blefaroplastia.id, medico: bervian.id, hosp: moinhos.id, valor: 12000, dur: 90 },
  ]

  for (const f of futuras) {
    const data = new Date()
    data.setDate(data.getDate() + f.diasAte)
    const userF = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        nome: `Paciente ${f.diasAte}d`,
        email: `paciente${f.diasAte}d${Date.now()}@example.com`,
        senhaHash,
        role: 'patient',
      },
    })
    const pacienteF = await prisma.paciente.create({
      data: {
        clinicId: clinic.id,
        userId: userF.id,
        procedimentoId: f.proc,
        medicoId: f.medico,
        status: 'pre_op',
        dataCirurgia: data,
        valor: f.valor,
      },
    })
    await prisma.cirurgia.create({
      data: {
        clinicId: clinic.id,
        pacienteId: pacienteF.id,
        procedimentoId: f.proc,
        medicoId: f.medico,
        hospitalId: f.hosp,
        data,
        horaInicio: '08:00',
        duracaoMin: f.dur,
        valor: f.valor,
        status: 'agendada',
      },
    })
  }

  console.log('✅ Seed concluído com sucesso!')
  console.log('')
  console.log('Credenciais de acesso:')
  console.log('  Admin:    admin@bervianlarsen.com.br / apice2026')
  console.log('  Paciente: fernanda@email.com / apice2026')
  console.log('  Dr. Bervian: fabricio@bervianlarsen.com.br / apice2026')
  console.log('  Dr. Larsen:  guilherme@bervianlarsen.com.br / apice2026')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
