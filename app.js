const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const contactsPath = path.join(__dirname, 'contacts.json');

function readContacts() {
  let contacts = [];
  try {
    const data = fs.readFileSync(contactsPath, 'utf8');
    contacts = JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT' || err.message.includes('Unexpected end of JSON input')) {
      console.log('Contacts file is empty or does not exist, initializing with an empty array.');
    } else {
      throw err;
    }
  }
  return contacts;
}

function writeContacts(contacts) {
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
}

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/contacts', (req, res) => {
  const contacts = readContacts();
  res.render('contacts', { contacts });
});

app.get('/contacts/new', (req, res) => {
  res.render('new');
});

app.get('/contacts/:id', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === req.params.id);
  if (!contact) {
    res.status(404).send('Contact not found');
  } else {
    contact.createdFormatted = new Date(contact.created).toLocaleString();
    contact.lastEditedFormatted = new Date(contact.lastEdited).toLocaleString();
    res.render('contact', { contact });
  }
});

app.post('/contacts', (req, res) => {
  const contacts = readContacts();
  const newContact = {
    id: uuidv4(),
    ...req.body,
    created: new Date().toISOString(),
    lastEdited: new Date().toISOString()
  };
  contacts.push(newContact);
  writeContacts(contacts);
  res.redirect(`/contacts/${newContact.id}`);
});

app.get('/contacts/:id/edit', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === req.params.id);
  res.render('editContact', { contact });
});

app.put('/contacts/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.map(c => {
    if (c.id === req.params.id) {
      return { ...c, ...req.body, lastEdited: new Date().toISOString() };
    }
    return c;
  });
  writeContacts(contacts);
  res.redirect(`/contacts/${req.params.id}`);
});

app.delete('/contacts/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.filter(c => c.id !== req.params.id);
  writeContacts(contacts);
  res.redirect('/contacts');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`Something broke! Error: ${err.message}`);
});

app.listen(3000, () => console.log('Server started on port 3000'));