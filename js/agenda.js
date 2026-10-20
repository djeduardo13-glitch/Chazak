  // Chazak — aba Agenda: eventos, calendário, lista, notificação de aniversários

  // ── AGENDA ──
  let agendaFilter = 'todos';
  let eventoEditIdx = null;

  const EVENT_COLORS = {
    'RDM':'#3D6B4F','RDJ':'#3D6B4F','Culto':'#4A6B8B','Culto Mocidade':'#4A6B8B',
    'Batismo':'#5B8FA8','Santa Ceia':'#7A5C9B','Busca dos Dons':'#8B6914',
    'Ensaio Regional':'#8B4A2E','RGI':'#C0392B','RMA':'#8B4A2E','RMN':'#C0392B',
    'Ministerial':'#8B4A2E','Conselhos':'#555','Outro':'#999'
  };

  const DEFAULT_EVENTOS = [
    // ── JANEIRO ──
    {tipo:'RDM',titulo:'RDM - Pianezza',data:'2026-01-18',hora:'10:00',local:'Pianezza',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Pianezza',data:'2026-01-18',hora:'15:00',local:'Pianezza',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - San Giorgio Bigarello',data:'2026-01-24',hora:'09:00',local:'San Giorgio Bigarello',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - San Giorgio Bigarello',data:'2026-01-24',hora:'14:00',local:'San Giorgio Bigarello',palavra:'',notas:'Ministero e Amministrazione'},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Pianezza',data:'2026-01-25',hora:'08:30',local:'Pianezza',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Pianezza',data:'2026-01-25',hora:'10:30',local:'Pianezza',palavra:'',notas:'Ministero e Amministrazione'},
    // ── FEVEREIRO ──
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Teramo',data:'2026-02-01',hora:'15:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Teramo',data:'2026-02-01',hora:'16:00',local:'Teramo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Belvedere M.',data:'2026-02-06',hora:'18:00',local:'Belvedere Marittimo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Belvedere M.',data:'2026-02-06',hora:'19:30',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Ragusa',data:'2026-02-07',hora:'14:00',local:'Ragusa',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Ragusa',data:'2026-02-07',hora:'16:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Dueville',data:'2026-02-07',hora:'19:30',local:'Dueville',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Dueville',data:'2026-02-08',hora:'10:00',local:'Dueville',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Busto Arsizio',data:'2026-02-21',hora:'18:30',local:'Busto Arsizio',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Busto Arsizio',data:'2026-02-22',hora:'10:00',local:'Busto Arsizio',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Diaconi - Teramo',data:'2026-02-28',hora:'10:00',local:'Teramo',palavra:'',notas:'Diaconi'},
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-02-28',hora:'14:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    // ── MARÇO ──
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-03-01',hora:'09:00',local:'Teramo',palavra:'',notas:'Ministero e Amministratori Invitati'},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - San Giorgio Bigarello',data:'2026-03-07',hora:'18:30',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - San Giorgio Bigarello',data:'2026-03-08',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Conselhos',titulo:'Conselhos SBI - San Giorgio Bigarello',data:'2026-03-14',hora:'14:30',local:'San Giorgio Bigarello',palavra:'',notas:'Spazio Biblico Infantile - Nacional'},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Roma',data:'2026-03-28',hora:'18:00',local:'Roma',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Roma',data:'2026-03-29',hora:'10:00',local:'Roma',palavra:'',notas:''},
    // ── ABRIL ──
    {tipo:'Ministerial',titulo:'Reunião Musical Nacional - San Giorgio Bigarello',data:'2026-04-04',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:'Inc. Regionali e Esaminatrici'},
    {tipo:'Ministerial',titulo:'Reunião Musical Nacional - San Giorgio Bigarello',data:'2026-04-04',hora:'15:00',local:'San Giorgio Bigarello',palavra:'',notas:'Incaricati, Esamninatrici e Istruttori'},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - San Giorgio Bigarello',data:'2026-04-04',hora:'19:30',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - San Giorgio Bigarello',data:'2026-04-05',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Perugia',data:'2026-04-11',hora:'18:30',local:'Perugia',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Barberino Val D\'Elsa',data:'2026-04-12',hora:'16:00',local:'Barberino Val D\'Elsa',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Sesto San Giovanni',data:'2026-04-12',hora:'18:00',local:'Sesto San Giovanni',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Beinette',data:'2026-04-18',hora:'19:00',local:'Beinette',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Beinette',data:'2026-04-19',hora:'10:00',local:'Beinette',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Coop. Giovani e Bambini',data:'2026-04-25',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Coop. Giovani, Bambini e Ausiliari',data:'2026-04-25',hora:'14:30',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Dueville',data:'2026-04-25',hora:'19:00',local:'Dueville',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - San Giorgio Bigarello',data:'2026-04-26',hora:'18:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    // ── MAIO ──
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Belvedere M.',data:'2026-05-02',hora:'16:00',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Belvedere M.',data:'2026-05-03',hora:'10:30',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Teramo',data:'2026-05-03',hora:'15:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Teramo',data:'2026-05-03',hora:'16:00',local:'Teramo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - San Giorgio Bigarello',data:'2026-05-09',hora:'09:00',local:'San Giorgio Bigarello',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - San Giorgio Bigarello',data:'2026-05-09',hora:'14:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Pianezza',data:'2026-05-10',hora:'09:00',local:'Pianezza',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Pianezza',data:'2026-05-10',hora:'11:00',local:'Pianezza',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Belvedere M.',data:'2026-05-15',hora:'18:00',local:'Belvedere Marittimo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Belvedere M.',data:'2026-05-15',hora:'19:30',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Ragusa',data:'2026-05-16',hora:'14:00',local:'Ragusa',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Ragusa',data:'2026-05-16',hora:'16:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Altedo',data:'2026-05-16',hora:'19:00',local:'Altedo',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Altedo',data:'2026-05-17',hora:'10:00',local:'Altedo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Spinetta Marengo',data:'2026-05-17',hora:'18:00',local:'Spinetta Marengo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Oppeano',data:'2026-05-23',hora:'18:00',local:'Oppeano',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Genova',data:'2026-05-24',hora:'16:00',local:'Genova',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Teramo',data:'2026-05-30',hora:'19:00',local:'Teramo',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Teramo',data:'2026-05-31',hora:'10:00',local:'Teramo',palavra:'',notas:''},
    // ── JUNHO ──
    {tipo:'Ministerial',titulo:'Reunião Diaconi - Teramo',data:'2026-06-05',hora:'20:00',local:'Teramo',palavra:'',notas:'Diaconi'},
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-06-06',hora:'10:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'Ministerial',titulo:'Insegnamenti Opera della Pietà - Teramo',data:'2026-06-06',hora:'15:00',local:'Teramo',palavra:'',notas:'Nacional'},
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-06-07',hora:'09:00',local:'Teramo',palavra:'',notas:'Ministero e Amministratori Invitati'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Roma',data:'2026-06-14',hora:'17:30',local:'Roma',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Busto Arsizio',data:'2026-06-20',hora:'18:30',local:'Busto Arsizio',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Trieste',data:'2026-06-21',hora:'17:00',local:'Trieste',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Collecchio',data:'2026-06-27',hora:'19:00',local:'Collecchio',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Collecchio',data:'2026-06-28',hora:'10:00',local:'Collecchio',palavra:'',notas:''},
    // ── JULHO ──
    {tipo:'Ministerial',titulo:'Reunião Porteiros e Ausiliari Porta',data:'2026-07-04',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:'Centro-Norte - Batismo'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Codogno',data:'2026-07-04',hora:'18:30',local:'Codogno',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Lodi',data:'2026-07-05',hora:'10:00',local:'Lodi',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Altedo',data:'2026-07-11',hora:'19:00',local:'Altedo',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Altedo',data:'2026-07-12',hora:'10:00',local:'Altedo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Anziani e Diaconi - Teramo',data:'2026-07-18',hora:'14:30',local:'Teramo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Administradores Nacionais - Teramo',data:'2026-07-19',hora:'09:00',local:'Teramo',palavra:'',notas:'Ausiliari, Collaboratori, C. Fiscale'},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Lioni',data:'2026-07-25',hora:'19:30',local:'Lioni',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Lioni',data:'2026-07-26',hora:'10:30',local:'Lioni',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Biella',data:'2026-07-26',hora:'18:00',local:'Biella',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Roncade',data:'2026-07-26',hora:'18:00',local:'Roncade',palavra:'',notas:''},
    // ── AGOSTO ──
    {tipo:'RGI',titulo:'RGI - Portugal',data:'2026-08-20',hora:'',local:'Portugal',palavra:'',notas:''},
    {tipo:'RGI',titulo:'RGI - Portugal',data:'2026-08-21',hora:'',local:'Portugal',palavra:'',notas:''},
    {tipo:'RGI',titulo:'RGI - Portugal',data:'2026-08-22',hora:'',local:'Portugal',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Beinette',data:'2026-08-29',hora:'19:00',local:'Beinette',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Beinette',data:'2026-08-30',hora:'10:00',local:'Beinette',palavra:'',notas:''},
    // ── SETEMBRO ──
    {tipo:'RGI',titulo:'RGI Diaconi - Belvedere M.',data:'2026-09-04',hora:'08:00',local:'Belvedere Marittimo',palavra:'',notas:'Diaconi'},
    {tipo:'RGI',titulo:'RGI Anziani e Diaconi - Belvedere M.',data:'2026-09-04',hora:'10:30',local:'Belvedere Marittimo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RGI',titulo:'RGI Geral - Belvedere M.',data:'2026-09-05',hora:'09:00',local:'Belvedere Marittimo',palavra:'',notas:'Anziani, Diaconi, Cooperatori, Amm. Invitati'},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Dueville',data:'2026-09-12',hora:'19:30',local:'Dueville',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Dueville',data:'2026-09-13',hora:'10:00',local:'Dueville',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Beinette',data:'2026-09-19',hora:'19:00',local:'Beinette',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Altedo',data:'2026-09-19',hora:'19:00',local:'Altedo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Spoltore',data:'2026-09-19',hora:'19:30',local:'Spoltore',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Belvedere M.',data:'2026-09-20',hora:'18:00',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Ferrara',data:'2026-09-20',hora:'18:00',local:'Ferrara',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Firenze',data:'2026-09-20',hora:'18:00',local:'Firenze',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Lodi',data:'2026-09-20',hora:'18:00',local:'Lodi',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Ragusa',data:'2026-09-26',hora:'15:30',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Ragusa',data:'2026-09-26',hora:'19:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Ragusa',data:'2026-09-27',hora:'10:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Isola d\'Elba',data:'2026-09-27',hora:'15:30',local:'Isola d\'Elba',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Piacenza',data:'2026-09-27',hora:'18:00',local:'Piacenza',palavra:'',notas:''},
    // ── OUTUBRO ──
    {tipo:'Ministerial',titulo:'Reunião Anziani e Diaconi - San Giorgio Bigarello',data:'2026-10-03',hora:'08:30',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Conselhos',titulo:'Conselhos do Ministério - San Giorgio Bigarello',data:'2026-10-03',hora:'10:00',local:'San Giorgio Bigarello',palavra:'',notas:'Anziani, Diaconi, Cooperatori'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Pianezza',data:'2026-10-04',hora:'19:00',local:'Pianezza',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Teramo',data:'2026-10-10',hora:'19:30',local:'Teramo',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Teramo',data:'2026-10-11',hora:'10:00',local:'Teramo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Trentola Ducenta',data:'2026-10-17',hora:'18:00',local:'Trentola Ducenta',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Collecchio',data:'2026-10-17',hora:'19:00',local:'Collecchio',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Aosta',data:'2026-10-17',hora:'19:00',local:'Aosta',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Ragusa',data:'2026-10-17',hora:'19:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Baronissi',data:'2026-10-18',hora:'18:00',local:'Baronissi',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Messina',data:'2026-10-18',hora:'18:00',local:'Messina',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Bianzone',data:'2026-10-18',hora:'15:00',local:'Bianzone',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Statte',data:'2026-10-24',hora:'18:00',local:'Statte',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Cerenzia',data:'2026-10-24',hora:'18:00',local:'Cerenzia',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Collecchio',data:'2026-10-24',hora:'19:00',local:'Collecchio',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Collecchio',data:'2026-10-25',hora:'10:00',local:'Collecchio',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Roseto Degli Abruzzi',data:'2026-10-30',hora:'20:00',local:'Roseto Degli Abruzzi',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Lioni',data:'2026-10-31',hora:'18:00',local:'Lioni',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Palermo',data:'2026-10-31',hora:'18:00',local:'Palermo',palavra:'',notas:''},
    // ── NOVEMBRO ──
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Inverigo',data:'2026-11-01',hora:'15:00',local:'Inverigo',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Petrella Tifernina',data:'2026-11-01',hora:'16:00',local:'Petrella Tifernina',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Chorio',data:'2026-11-01',hora:'17:00',local:'Chorio',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - San Giorgio Bigarello',data:'2026-11-07',hora:'09:00',local:'San Giorgio Bigarello',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - San Giorgio Bigarello',data:'2026-11-07',hora:'14:00',local:'San Giorgio Bigarello',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Sardegna',data:'2026-11-07',hora:'19:00',local:'Sardegna',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Pianezza',data:'2026-11-08',hora:'09:00',local:'Pianezza',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Pianezza',data:'2026-11-08',hora:'11:00',local:'Pianezza',palavra:'',notas:''},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Spinetta Marengo',data:'2026-11-14',hora:'15:30',local:'Spinetta Marengo',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Spinetta Marengo',data:'2026-11-14',hora:'19:30',local:'Spinetta Marengo',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Spinetta Marengo',data:'2026-11-15',hora:'10:00',local:'Spinetta Marengo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Teramo',data:'2026-11-15',hora:'15:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Teramo',data:'2026-11-15',hora:'16:00',local:'Teramo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Belvedere M.',data:'2026-11-20',hora:'18:00',local:'Belvedere Marittimo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Belvedere M.',data:'2026-11-20',hora:'19:30',local:'Belvedere Marittimo',palavra:'',notas:''},
    {tipo:'Ministerial',titulo:'Reunião Ministerial - Ragusa',data:'2026-11-21',hora:'14:00',local:'Ragusa',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'RMA',titulo:'RMA - Ragusa',data:'2026-11-21',hora:'16:00',local:'Ragusa',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia (Geral) - Ragusa',data:'2026-11-21',hora:'19:00',local:'Ragusa',palavra:'',notas:'Geral'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia - Torre Boldone',data:'2026-11-21',hora:'19:00',local:'Torre Boldone',palavra:'',notas:''},
    {tipo:'Santa Ceia',titulo:'Santa Ceia (Geral) - Belvedere M.',data:'2026-11-22',hora:'18:30',local:'Belvedere Marittimo',palavra:'',notas:'Geral'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia (Geral) - Sesto San Giovanni',data:'2026-11-28',hora:'18:00',local:'Sesto San Giovanni',palavra:'',notas:'Geral'},
    // ── DEZEMBRO ──
    {tipo:'Ministerial',titulo:'Reunião Diaconi - Teramo',data:'2026-12-04',hora:'20:00',local:'Teramo',palavra:'',notas:'Diaconi'},
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-12-05',hora:'10:00',local:'Teramo',palavra:'',notas:'Anziani e Diaconi'},
    {tipo:'Ministerial',titulo:'Insegnamenti Opera della Pietà - Teramo',data:'2026-12-05',hora:'15:00',local:'Teramo',palavra:'',notas:'Nacional'},
    {tipo:'RMN',titulo:'RMN - Teramo',data:'2026-12-06',hora:'09:00',local:'Teramo',palavra:'',notas:'Ministero e Amministratori Invitati'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia (Geral) - Teramo',data:'2026-12-06',hora:'18:30',local:'Teramo',palavra:'',notas:'Geral'},
    {tipo:'Santa Ceia',titulo:'Santa Ceia (Geral) - Pianezza',data:'2026-12-13',hora:'19:00',local:'Pianezza',palavra:'',notas:'Geral'},
    {tipo:'Ensaio Regional',titulo:'Ensaio Regional - Baronissi',data:'2026-12-25',hora:'15:30',local:'Baronissi',palavra:'',notas:''},
    {tipo:'Busca dos Dons',titulo:'Busca dos Dons - Baronissi',data:'2026-12-25',hora:'19:30',local:'Baronissi',palavra:'',notas:''},
    {tipo:'RDM',titulo:'RDM - Baronissi',data:'2026-12-26',hora:'10:00',local:'Baronissi',palavra:'',notas:''},
  ];


  // ── CALENDAR ──
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  let calDate = new Date();
  let selectedDay = null; // 'YYYY-MM-DD'


  // Build map of date → [events+birthdays] for fast calendar lookup
  function buildDayMap() {
    const map = {};
    const addToMap = (dateStr, item) => {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    };

    // Eventos
    (db.eventos || []).forEach(ev => {
      if (ev.data) addToMap(ev.data, { ...ev, _kind: 'evento' });
    });

    // Aniversários — colocar no ano corrente do calDate
    const y = calDate.getFullYear();
    (db.jovens || []).forEach(j => {
      if (!j.aniv) return;
      const parts = j.aniv.split('/');
      if (parts.length < 2) return;
      const [dd, mm] = parts;
      const dateStr = `${y}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
      addToMap(dateStr, { tipo: 'Aniversário', titulo: `🎂 ${j.name}`, data: dateStr, hora: '', local: '', palavra: '', notas: '', _kind: 'aniv', _jovemIdx: db.jovens.indexOf(j) });
    });

    return map;
  }

  function renderCalendar() {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    document.getElementById('cal-month-label').textContent = MONTHS[m] + ' ' + y;

    const dayMap = buildDayMap();
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    // Day labels
    DAYS.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-day-label';
      el.textContent = d;
      grid.appendChild(el);
    });

    const firstDayRaw = new Date(y, m, 1).getDay(); // 0=Sun
    const firstDay = (firstDayRaw + 6) % 7; // Mon=0, Tue=1, ... Sun=6
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();

    // Empty cells (prev month)
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day other-month';
      const prevD = new Date(y, m, -(firstDay - i - 1));
      el.innerHTML = `<div class="cal-day-num">${prevD.getDate()}</div>`;
      grid.appendChild(el);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
      const isSelected = dateStr === selectedDay;
      const items = dayMap[dateStr] || [];

      // Unique colors for dots (max 3)
      const colors = [...new Set(items.map(ev => EVENT_COLORS[ev.tipo] || '#999'))].slice(0, 3);

      const el = document.createElement('div');
      el.className = 'cal-day' + (isSelected ? ' selected' : '');
      el.dataset.date = dateStr;

      const numEl = document.createElement('div');
      numEl.className = 'cal-day-num';
      numEl.textContent = d;
      if (isToday) numEl.style.cssText = 'background:var(--accent);color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:600';
      el.appendChild(numEl);

      if (colors.length) {
        const dotsEl = document.createElement('div');
        dotsEl.className = 'cal-dots';
        colors.forEach(c => {
          const dot = document.createElement('div');
          dot.className = 'cal-dot';
          dot.style.background = c;
          dotsEl.appendChild(dot);
        });
        el.appendChild(dotsEl);
      }

      el.onclick = () => openDia(dateStr, items);
      grid.appendChild(el);
    }
  }

  function changeMonth(dir) {
    calDate.setMonth(calDate.getMonth() + dir);
    selectedDay = null;
    renderCalendar();
    renderAgenda();
  }

  // ── OPEN DAY POPUP ──
  let diaDateStr = null;
  function openDia(dateStr, _ignored) {
    selectedDay = dateStr;
    diaDateStr = dateStr;

    // Mark selected day visually without full re-render
    document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
    const target = document.querySelector(`.cal-day[data-date="${dateStr}"]`);
    if (target) target.classList.add('selected');

    // Always fetch fresh items from dayMap
    const dayMap = buildDayMap();
    const items = dayMap[dateStr] || [];

    const d = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });
    document.getElementById('dia-titulo').textContent = label.charAt(0).toUpperCase() + label.slice(1);

    const container = document.getElementById('dia-eventos');
    if (!items.length) {
      container.innerHTML = `<div style="font-size:13px;color:var(--muted);padding:12px 0;text-align:center">Nenhum evento neste dia.<br><br>Toque em <b>+ Novo</b> para criar um.</div>`;
    } else {
      container.innerHTML = items.map(ev => {
        const color = EVENT_COLORS[ev.tipo] || '#999';
        const idx = ev._kind !== 'aniv' ? (db.eventos||[]).findIndex(e => e.data===ev.data && e.titulo===ev.titulo && e.tipo===ev.tipo) : -1;
        return `
        <div class="ev-card">
          <div class="ev-card-stripe" style="background:${color}"></div>
          <div class="ev-card-body">
            <div class="ev-card-tipo" style="color:${color}">${esc(ev.tipo)}</div>
            <div class="ev-card-titulo">${esc(ev.titulo)}</div>
            <div class="ev-card-meta">
              ${ev.hora ? '🕐 '+esc(ev.hora) : ''}${ev.hora && ev.local ? ' · ' : ''}${ev.local ? '📍 '+esc(ev.local) : ''}
              ${ev.palavra ? '<br>📖 '+esc(ev.palavra) : ''}
              ${ev.notas ? '<br><i>'+esc(ev.notas)+'</i>' : ''}
            </div>
          </div>
          ${idx >= 0 ? `
          <div class="ev-card-actions">
            <button class="ev-icon-btn ev-importante-btn" onclick="toggleImportante(${idx},this)"
              style="font-size:14px;font-weight:700;opacity:${(db.eventos[idx]&&db.eventos[idx].importante)?'1':'0.25'};color:${(db.eventos[idx]&&db.eventos[idx].importante)?'#E07B54':'var(--muted)'}">!</button>
            <button class="ev-icon-btn" onclick="openEditEventoFromDia(${idx})">✏️</button>
            <button class="ev-icon-btn" style="color:#E07B54;border-color:#fbddd5" onclick="delEventoFromDia(${idx})">🗑</button>
          </div>` : ''}
        </div>`;
      }).join('');
    }
    openModal('modal-dia');
  }

  function openNovoEventoNoDia() {
    closeModal('modal-dia');
    openNovoEvento(diaDateStr);
  }

  function openEditEventoFromDia(idx) {
    closeModal('modal-dia');
    openEditEvento(idx);
  }

  async function delEventoFromDia(idx) {
    if (await chzConfirm('Remover este evento?', 'Remover')) {
      db.eventos.splice(idx, 1);
      saveDB();
      closeModal('modal-dia');
      renderCalendar();
      renderAgenda();
    }
  }

  // ── AGENDA LIST ──

  function initEventos() {
    if (!db.eventos) db.eventos = [];
    // Merge in any DEFAULT event not yet in db (match by data+tipo+local)
    let changed = false;
    DEFAULT_EVENTOS.forEach(def => {
      const exists = db.eventos.find(e => e.data === def.data && e.tipo === def.tipo && e.local === def.local);
      if (!exists) { db.eventos.push({...def}); changed = true; }
    });
    if (changed) saveDB();
  }

  function toggleImportante(idx, btn) {
    if (!db.eventos[idx]) return;
    db.eventos[idx].importante = !db.eventos[idx].importante;
    saveDB();
    const on = db.eventos[idx].importante;
    btn.style.opacity = on ? '1' : '0.25';
    btn.style.color = on ? '#E07B54' : 'var(--muted)';
    renderAgenda(); // re-render to show/hide banner
  }

  function setAgendaFilter(el, filter) {
    document.querySelectorAll('#sec-agenda .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    agendaFilter = filter;
    renderAgenda();
  }

  function renderAgenda() {
    const y = calDate.getFullYear(), m = calDate.getMonth();
    const monthStr = `${y}-${String(m+1).padStart(2,'0')}`;
    const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const container = document.getElementById('agenda-list');
    if (!container) return;
    container.innerHTML = '';

    // ── Subsection: Eventos Importantes próximos (7 dias) ──
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const em7dias = new Date(hoje);
    em7dias.setDate(hoje.getDate() + 7);
    const importantesProximos = (db.eventos||[]).filter(ev => {
      if (!ev.importante) return false;
      const d = new Date(ev.data + 'T00:00:00');
      return d >= hoje && d <= em7dias;
    });
    importantesProximos.sort((a,b) => a.data.localeCompare(b.data));

    if (importantesProximos.length) {
      const lblImp = document.createElement('div');
      lblImp.className = 'agenda-section-label';
      lblImp.innerHTML = '⚠️ Importante!';
      lblImp.style.cssText = 'color:#E07B54;font-weight:700';
      container.appendChild(lblImp);

      const wrapImp = document.createElement('div');
      wrapImp.style.cssText = 'background:var(--surface);border:1px solid #E07B54;border-left:4px solid #E07B54;border-radius:var(--radius);margin-bottom:18px;overflow:hidden';
      importantesProximos.forEach((ev, i) => {
        const d = new Date(ev.data + 'T00:00:00');
        const dayStr = d.toLocaleDateString('pt-BR', {weekday:'short', day:'numeric', month:'short'});
        const diasFaltam = Math.round((d - hoje) / 86400000);
        const faltaStr = diasFaltam === 0 ? 'Hoje!' : diasFaltam === 1 ? 'Amanhã' : `em ${diasFaltam} dias`;
        const row = document.createElement('div');
        row.style.cssText = `padding:10px 14px;font-size:13px;${i > 0 ? 'border-top:1px solid var(--border)' : ''}`;
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">${esc(ev.titulo || ev.local)}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">${dayStr}${ev.hora ? ' · '+esc(ev.hora) : ''}${ev.local ? ' · 📍'+esc(ev.local) : ''}</div>
            </div>
            <div style="font-size:11px;font-weight:600;color:#E07B54;white-space:nowrap;margin-left:10px">${faltaStr}</div>
          </div>`;
        wrapImp.appendChild(row);
      });
      container.appendChild(wrapImp);
    }

    // ── Subsection: Aniversários do mês (read-only, from jovens) ──
    const anivs = [];
    (db.jovens || []).forEach(j => {
      if (!j.aniv) return;
      const [dd, mm] = j.aniv.split('/');
      if (parseInt(mm) - 1 === m) anivs.push({ name: j.name, dd: parseInt(dd), aniv: j.aniv });
    });
    anivs.sort((a, b) => a.dd - b.dd);

    if (anivs.length) {
      const lbl = document.createElement('div');
      lbl.className = 'agenda-section-label';
      lbl.innerHTML = `🎂 Aniversários — ${MONTHS_PT[m]}`;
      container.appendChild(lbl);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;margin-bottom:16px;display:flex;flex-direction:column;gap:4px';
      anivs.forEach(a => {
        const row = document.createElement('div');
        const today = new Date();
        const isToday = a.dd === today.getDate() && m === today.getMonth();
        row.style.cssText = `font-size:13px;font-weight:${isToday ? '700' : '400'};color:${isToday ? 'var(--accent)' : 'var(--text)'}`;
        row.textContent = `${isToday ? '🎂 ' : ''}${a.name} - ${String(a.dd).padStart(2,'0')}/${String(m+1).padStart(2,'0')}`;
        wrap.appendChild(row);
      });
      container.appendChild(wrap);
    }

    // ── Events of this month grouped by type ──
    let eventos = (db.eventos || []).filter(e => e.data && e.data.startsWith(monthStr));

    // Apply filter
    if (agendaFilter !== 'todos') {
      eventos = eventos.filter(e =>
        e.tipo === agendaFilter ||
        (agendaFilter === 'Culto' && e.tipo.startsWith('Culto'))
      );
    }
    eventos.sort((a, b) => a.data.localeCompare(b.data) || (a.hora||'').localeCompare(b.hora||''));

    // Group by tipo
    const TYPE_ORDER = ['RDM','RDJ','Busca dos Dons','Ensaio Regional','Santa Ceia','RGI','Ministerial','RMA','RMN','Conselhos','Outro'];
    const groups = {};
    eventos.forEach(ev => {
      const key = ev.tipo;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });

    // Determine today's date string for past/future comparison
    const todayStr = new Date().toISOString().slice(0,10);

    // Classify each group: allPast if every event is before today
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ia = TYPE_ORDER.indexOf(a), ib = TYPE_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    const activeKeys = sortedKeys.filter(k => groups[k].some(e => e.data >= todayStr));
    const pastKeys   = sortedKeys.filter(k => groups[k].every(e => e.data < todayStr));
    const orderedKeys = [...activeKeys, ...pastKeys];

    if (orderedKeys.length === 0 && anivs.length === 0) {
      container.innerHTML += `<div class="empty-state" style="padding:30px 0"><div class="empty-icon">📅</div><div class="empty-desc">Nenhum evento em ${MONTHS_PT[m]}.</div></div>`;
      return;
    }

    const COLOR = {
      'RDM':'#3D6B4F','RDJ':'#2E7D52','Busca dos Dons':'#C07D14',
      'Ensaio Regional':'#A0522D','Santa Ceia':'#7A5C9B','RGI':'#C0392B',
      'Ministerial':'#6D4C41','RMA':'#8B4A2E','RMN':'#D32F2F',
      'Conselhos':'#546E7A','Outro':'#757575'
    };

    orderedKeys.forEach(tipo => {
      const evs = groups[tipo];
      const color = COLOR[tipo] || '#757575';
      const groupAllPast = evs.every(e => e.data < todayStr);

      // Sort: future/today first, past last — within group
      const evsSorted = [...evs].sort((a, b) => {
        const aP = a.data < todayStr, bP = b.data < todayStr;
        if (aP !== bP) return aP ? 1 : -1; // past goes last
        return a.data.localeCompare(b.data);
      });

      const lbl = document.createElement('div');
      lbl.className = 'agenda-section-label';
      lbl.style.opacity = groupAllPast ? '0.45' : '1';
      lbl.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle"></span>${esc(tipo)}`;
      container.appendChild(lbl);

      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-left:3px solid '+color+';border-radius:var(--radius);margin-bottom:16px;overflow:hidden'
        + (groupAllPast ? ';opacity:0.45' : '');

      evsSorted.forEach((ev, i) => {
        const realIdx = (db.eventos||[]).findIndex(e => e.data===ev.data && e.tipo===ev.tipo && e.local===ev.local);
        const isPast = ev.data < todayStr;
        const d = new Date(ev.data+'T00:00:00');
        const dayStr = d.toLocaleDateString('pt-BR', {weekday:'short', day:'numeric'});
        const row = document.createElement('div');
        // Individual row dimming only when group is NOT all-past (mixed group)
        const rowOpacity = (!groupAllPast && isPast) ? ';opacity:0.4' : '';
        row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:9px 14px;font-size:13px;${i > 0 ? 'border-top:1px solid var(--border)' : ''}${rowOpacity}`;
        row.innerHTML = `
          <div style="flex:1;min-width:0;cursor:pointer" onclick="openDia('${escJs(ev.data)}',[])">
            <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ev.local || ev.titulo)}</div>
            <div style="font-size:11px;color:var(--muted)">${dayStr}${ev.hora ? ' · '+esc(ev.hora) : ''}${ev.notas ? ' · <i>'+esc(ev.notas)+'</i>' : ''}</div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px">
            <button onclick="toggleImportante(${realIdx},this)" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 7px;font-size:12px;font-weight:700;cursor:pointer;opacity:${ev.importante?'1':'0.25'};color:${ev.importante?'#E07B54':'var(--muted)'}">!</button>
            <button onclick="openEditEvento(${realIdx})" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 7px;font-size:11px;cursor:pointer">✏️</button>
            <button onclick="delEvento(${realIdx})" style="background:none;border:1px solid #fbddd5;border-radius:8px;padding:4px 7px;font-size:11px;cursor:pointer;color:#E07B54">🗑</button>
          </div>`;
        wrap.appendChild(row);
      });
      container.appendChild(wrap);
    });

    // ── Past & future summary ──
    const future = (db.eventos||[]).filter(e => e.data && e.data > monthStr);
    const past = (db.eventos||[]).filter(e => e.data && e.data < monthStr && e.data.slice(0,4) === String(y));
    if (future.length || past.length) {
      const info = document.createElement('div');
      info.style.cssText = 'font-size:11px;color:var(--muted);text-align:center;padding:8px 0 4px';
      info.textContent = `${future.length} eventos futuros · ${past.length} passados neste ano`;
      container.appendChild(info);
    }
  }

  function openNovoEvento(prefillDate) {
    eventoEditIdx = null;
    document.getElementById('evento-modal-title').textContent = 'Novo Evento';
    document.getElementById('ev-tipo').value = 'RDM';
    document.getElementById('ev-titulo').value = '';
    document.getElementById('ev-data').value = prefillDate || new Date().toISOString().slice(0,10);
    document.getElementById('ev-hora').value = '';
    const _evLoc = document.getElementById('ev-local-input'); if(_evLoc) _evLoc.value='';
    document.getElementById('ev-palavra').value = '';
    document.getElementById('ev-notas').value = '';
    document.getElementById('ev-save-btn').textContent = 'Salvar';
    openModal('modal-evento');
  }

  function openEditEvento(idx) {
    eventoEditIdx = idx;
    const ev = db.eventos[idx];
    document.getElementById('evento-modal-title').textContent = 'Editar Evento';
    document.getElementById('ev-tipo').value = ev.tipo;
    document.getElementById('ev-titulo').value = ev.titulo;
    document.getElementById('ev-data').value = ev.data;
    document.getElementById('ev-hora').value = ev.hora || '';
    const _evLocEdit = document.getElementById('ev-local-input'); if(_evLocEdit) _evLocEdit.value = ev.local || '';
    document.getElementById('ev-palavra').value = ev.palavra || '';
    document.getElementById('ev-notas').value = ev.notas || '';
    document.getElementById('ev-save-btn').textContent = 'Atualizar';
    openModal('modal-evento');
  }

  function saveEvento() {
    const ev = {
      tipo: document.getElementById('ev-tipo').value,
      titulo: document.getElementById('ev-titulo').value.trim() || document.getElementById('ev-tipo').value,
      data: document.getElementById('ev-data').value,
      hora: document.getElementById('ev-hora').value,
      local: (document.getElementById('ev-local-input')||{}).value?.trim()||'',
      palavra: document.getElementById('ev-palavra').value,
      notas: document.getElementById('ev-notas').value,
    };
    if (!ev.data) { chzAlert('Selecione uma data!'); return; }

    // Preservar _eventoRef existente ao editar
    if (eventoEditIdx !== null) {
      const old = db.eventos[eventoEditIdx];
      if (old._eventoRef) ev._eventoRef = old._eventoRef;
      db.eventos[eventoEditIdx] = ev;
    } else {
      if (!db.eventos) db.eventos = [];
      db.eventos.push(ev);
    }

    // ── Sync com Palavras ──
    _syncEventoParaPalavras(ev);

    saveDB();
    closeModal('modal-evento');
    renderCalendar();
    renderAgenda();
    renderServicos();
  }

  function _syncEventoParaPalavras(ev) {
    if (!db.servicos) db.servicos = [];

    // Gerar ou reutilizar chave de referência única
    if (!ev._eventoRef) ev._eventoRef = 'ev_' + ev.data + '_' + (ev.tipo||'').replace(/\s/g,'') + '_' + (ev.local||'').replace(/\s/g,'').slice(0,8);

    // Procurar registo existente vinculado a este evento
    const existIdx = db.servicos.findIndex(s => s._eventoRef === ev._eventoRef);

    if (ev.palavra && ev.palavra.trim()) {
      // Criar ou atualizar registo em Palavras
      const registo = {
        tipo: ev.tipo,
        data: ev.data,
        local: ev.local || ev.titulo || '',
        palavra: ev.palavra.trim(),
        notas: ev.notas || '',
        _eventoRef: ev._eventoRef,
      };
      if (existIdx >= 0) {
        db.servicos[existIdx] = registo;
      } else {
        db.servicos.unshift(registo);
      }
    } else {
      // Palavra apagada — remover registo vinculado
      if (existIdx >= 0) db.servicos.splice(existIdx, 1);
    }
  }

  async function delEvento(idx) {
    if (await chzConfirm('Remover este evento?', 'Remover')) {
      db.eventos.splice(idx, 1);
      saveDB();
      renderCalendar();
      renderAgenda();
    }
  }

  // ══════════════════════════════════════════
  // NOTIFICAÇÃO LOCAL — bolinha no ícone do cabeçalho
  // Por enquanto só aniversários (nascimento e batismo), hoje e amanhã.
  // Puramente calculado a partir dos dados (sem permissões do browser,
  // sem push) — recalcula sempre que os dados são guardados ou a app abre.
  // ══════════════════════════════════════════
  function getAniversariosProximos() {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
    const hojeMM = hoje.getMonth() + 1, hojeDD = hoje.getDate();
    const amanhaMM = amanha.getMonth() + 1, amanhaDD = amanha.getDate();
    const CAMPOS = [
      { campo: 'aniv',    icon: '🎂', label: 'Aniversário' },
      { campo: 'batismo', icon: '💧', label: 'Aniversário de batismo' },
    ];
    const resultados = [];
    (db.jovens || []).filter(j => j.ativo !== false).forEach(j => {
      CAMPOS.forEach(({ campo, icon, label }) => {
        const val = j[campo];
        if (!val) return;
        const parts = val.split('/');
        if (parts.length < 2) return; // precisa pelo menos dd/mm
        const dd = parseInt(parts[0], 10), mm = parseInt(parts[1], 10);
        if (isNaN(dd) || isNaN(mm)) return;
        if (mm === hojeMM && dd === hojeDD) resultados.push({ nome: j.name, icon, label, quando: 'hoje' });
        else if (mm === amanhaMM && dd === amanhaDD) resultados.push({ nome: j.name, icon, label, quando: 'amanhã' });
      });
    });
    return resultados;
  }

  function atualizarBadgeAniversarios() {
    const badge = document.getElementById('header-icon-badge');
    if (!badge) return;
    const lista = getAniversariosProximos();
    if (lista.length) {
      badge.textContent = lista.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function mostrarAniversariosHoje() {
    const lista = getAniversariosProximos();
    if (!lista.length) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding-top:18vh';
    overlay.onclick = () => overlay.remove();

    const card = document.createElement('div');
    card.style.cssText = 'background:var(--surface);border-radius:14px;padding:16px 18px;max-width:320px;width:85%;box-shadow:0 8px 24px rgba(0,0,0,0.25)';
    card.onclick = (e) => e.stopPropagation();

    const linhas = lista.map(l => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:20px">${l.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600">${esc(l.nome)}</div>
          <div style="font-size:11px;color:var(--muted)">${l.label} · ${l.quando === 'hoje' ? 'Hoje!' : 'Amanhã'}</div>
        </div>
      </div>`).join('');

    card.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:6px">🔔 Aniversários</div>
      <div>${linhas}</div>
      <button onclick="this.closest('div[style*=fixed]').remove()" style="margin-top:12px;width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--muted);font-size:12px;cursor:pointer">Fechar</button>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

