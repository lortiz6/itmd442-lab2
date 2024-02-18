// Import necessary modules
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

// Set up Pug as view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Define the path for the JSON file
const contactsPath = path.join(__dirname, 'contacts.json');

// Function to read contacts from the JSON file
function readContacts() {
  const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
  return contacts;
}

// Function to write contacts to the JSON file
function writeContacts(contacts) {
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2));
}

app.get('/', (req, res) => {
  res.render('index');
});

// Route to render the contacts page
app.get('/contacts', (req, res) => {
  const contacts = readContacts();
  res.render('contacts', { contacts });
});

// Route to render the new contact form
app.get('/contacts/new', (req, res) => {
  res.render('new');
});
// Route to render a single contact
app.get('/contacts/:id', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === req.params.id);
  if (!contact) {
    res.status(404).send('Contact not found');
  } else {
    // Format the dates before sending to the template
    contact.createdFormatted = new Date(contact.created).toLocaleString();
    contact.lastEditedFormatted = new Date(contact.lastEdited).toLocaleString();
    
    res.render('contact', { contact });
  }
});


// Route to create a new contact
app.post('/contacts', (req, res) => {
  const contacts = readContacts();
  const newContact = {
    id: uuidv4(),
    ...req.body,
    created: new Date().toISOString(), // Store creation date/time
    lastEdited: new Date().toISOString() // Initialize last edited as creation time
  };
  contacts.push(newContact);
  writeContacts(contacts);
  res.redirect(`/contacts/${newContact.id}`);
});

// Route to render the edit contact form
app.get('/contacts/:id/edit', (req, res) => {
  const contacts = readContacts();
  const contact = contacts.find(c => c.id === req.params.id);
  res.render('editContact', { contact });
});

// Route to update a contact
app.put('/contacts/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.map(c => {
    if (c.id === req.params.id) {
      return { ...c, ...req.body, lastEdited: new Date().toISOString() }; // Update last edited date/time
    }
    return c;
  });
  writeContacts(contacts);
  res.redirect(`/contacts/${req.params.id}`);
});


// Route to delete a contact
app.delete('/contacts/:id', (req, res) => {
  let contacts = readContacts();
  contacts = contacts.filter(c => c.id !== req.params.id);
  writeContacts(contacts);
  res.redirect('/contacts');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

function readContacts() {
  let contacts = [];
  try {
    const data = fs.readFileSync(contactsPath, 'utf8');
    contacts = JSON.parse(data);
  } catch (err) {
    // If the error is because the file is empty or doesn't exist, log it and return an empty array
    if (err.code === 'ENOENT' || err.message.includes('Unexpected end of JSON input')) {
      console.log('Contacts file is empty or does not exist, initializing with an empty array.');
    } else {
      // If it's a different kind of error, throw it
      throw err;
    }
  }
  return contacts;
}

// Start the server
app.listen(3000, () => console.log('Server started on port 3000'));