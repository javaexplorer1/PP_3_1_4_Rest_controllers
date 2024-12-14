document.addEventListener('DOMContentLoaded', function () {
    fetchRoles();
    getAuth();
});
const URL = "http://localhost:8080/api";
const userFetchService = {
    head: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Referer': null
    },
    getAuthUser: async () => await fetch(URL + '/user'),
    getUsers: async () => await fetch(URL + '/admin/users'),
    getUser: async (id) => await fetch(URL + `/admin/users/${id}`),
    saveUser: async (user) => {
        const method = user.id ? 'PUT' : 'POST';
        try {
            const response = await fetch(URL + '/admin/users', {
                method: method,
                headers: userFetchService.head,
                body: JSON.stringify(user)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save user: ${errorText}`);
            }
            return response;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    },
    deleteUser: async (id) => {
        try {
            const response = await fetch(URL + `/admin/users/${id}`, {
                method: 'DELETE',
                headers: userFetchService.head
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete user: ${errorText}`);
            }
            return response;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
};

async function getAuth() {
    try {
        let response = await userFetchService.getAuthUser();
        if (!response.ok) throw new Error('Failed to fetch authenticated user');
        let authUser = await response.json();
        console.log('Authenticated user:', authUser);

        const authUsername = document.querySelector('#authUsername');
        const authRoles = document.querySelector('#authRoles');
        authUsername.innerText = authUser.username;
        authRoles.innerText = getRoles(authUser.roles);
        const authInfo = document.querySelector('#authInfo');
        if (authInfo) {
            const columns = authInfo.children;
            setUserRow(columns, authUser);
        }

        const adminTab = document.querySelector('#adminTab');
        const adminPanel = document.querySelector('#admin-panel');
        const userTab = document.querySelector('#userTab');
        const userPanel = document.querySelector('#user-panel');

        if (authUser.roles.some(role => role.role === 'ROLE_ADMIN')) {
            adminTab.classList.add('active');
            adminPanel.classList.add('show', 'active');
            userTab.classList.remove('active');
            userPanel.classList.remove('show', 'active');
            await getUsers();
        } else {
            adminTab.classList.add('d-none');
            adminPanel.classList.add('d-none');

            userTab.classList.add('active');
            userPanel.classList.add('show', 'active');
        }

        await updateUserPanel(authUser);
    } catch (error) {
        console.error('Error fetching authenticated user:', error);
    }
}

async function handlerUserButton(event) {
    let id = Number(event.target.dataset.index);
    if (id) {
        let typeButton = event.target.dataset.type;
        try {
            let response = await userFetchService.getUser(id);
            if (!response.ok) throw new Error('Failed to fetch user data');
            let user = await response.json();
            if (typeButton === 'edit') {
                const editForm = document.querySelector('#editForm');
                inputModal(user, editForm, 'edit');
                const editBtn = document.querySelector('#editBtn');
                editBtn.removeEventListener('click', handlerEditButton);
                editBtn.addEventListener('click', handlerEditButton);
            } else if (typeButton === 'delete') {
                const deleteForm = document.querySelector('#deleteForm');
                inputModal(user, deleteForm, 'delete');
                const deleteBtn = document.querySelector('#deleteBtn');
                deleteBtn.removeEventListener('click', handlerDeleteButton);
                deleteBtn.addEventListener('click', handlerDeleteButton);
            }
        } catch (error) {
            console.error('Error handling user button:', error);
        }
    }
}

async function handlerAddButton(event) {
    event.preventDefault();
    const elements = event.target.form.elements;
    const username = elements.usernameAdd.value.trim();
    const age = elements.ageAdd.value.trim();
    const email = elements.emailAdd.value.trim();
    const password = elements.passwordAdd.value.trim();
    const roles = Array.from(elements.rolesAdd.options)
        .filter(option => option.selected)
        .map(option => ({id: rolesMap[option.value], role: option.value}));

    const data = {
        username: username,
        age: age,
        email: email,
        password: password,
        roles: roles
    };
    try {
        await userFetchService.saveUser(data);
        clearAddForm();
        const usersTableTab = document.querySelector('#show-users-table');
        usersTableTab.click();
        await getUsers();
    } catch (error) {
        console.error('Error adding user:', error);
    }
}

async function handlerEditButton(event) {
    event.preventDefault();
    const elements = event.target.form.elements;
    const username = elements.usernameEdit.value.trim();
    const age = elements.ageEdit.value.trim();
    const email = elements.emailEdit.value.trim();
    const password = elements.passwordEdit.value.trim();
    const roles = Array.from(elements.editRoles.options)
        .filter(option => option.selected)
        .map(option => ({id: rolesMap[option.value], role: option.value}));

    const data = {
        id: elements.idEdit.value,
        username: username,
        age: age,
        email: email,
        password: password,
        roles: roles
    };
    try {
        await userFetchService.saveUser(data);
        const modal = bootstrap.Modal.getInstance(document.querySelector('#editUser'));
        modal.hide();
        await getAuth();
        await getUsers();
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

async function handlerDeleteButton(event) {
    event.preventDefault();
    const id = document.querySelector('#idDelete').value;
    if (!id) {
        console.error("User ID is not set.");
        return;
    }
    try {
        await userFetchService.deleteUser(id);
        const deleteModal = bootstrap.Modal.getInstance(document.querySelector('#delUser'));
        deleteModal.hide();
        await getUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

function clearAddForm() {
    const addForm = document.querySelector('#addForm');
    for (let i = 0; i < addForm.length; i++) {
        addForm[i].value = '';
    }
}

function setUserRow(columns, thisUser) {
    columns[0].innerText = thisUser.id;
    columns[1].innerText = thisUser.username;
    columns[2].innerText = thisUser.age;
    columns[3].innerText = thisUser.email;
    columns[4].innerText = getRoles(thisUser.roles);
}

function getRoles(listRoles) {
    return listRoles.map(role => role.role).join(' ');
}

function inputModal(user, formElement, type) {
    formElement[0].value = user.id;
    formElement[1].value = user.username;
    formElement[2].value = user.age;
    formElement[3].value = user.email;
    if (type === 'edit') {
        formElement[4].value = '';
        const rolesOptions = formElement[5].options;
        Array.from(rolesOptions).forEach(option => {
            option.selected = user.roles.some(role => role.role === option.value);
        });
        formElement[6].value = "Edit";
    } else if (type === 'delete') {
        formElement[6].value = "Delete";
    }
}

async function getUsers() {
    try {
        let response = await userFetchService.getUsers();
        if (!response.ok) throw new Error('Failed to fetch users');
        let listUsers = await response.json();
        const userTable = document.querySelector('#userTable');
        const userRow = document.querySelector('#userRow');
        userTable.innerHTML = '';
        for (let user of listUsers) {
            let newRow = userRow.content.firstElementChild.cloneNode(true);
            newRow.addEventListener('click', handlerUserButton);
            let columns = newRow.children;
            setUserRow(columns, user);
            columns[5].firstElementChild.dataset.index = user.id;
            columns[6].firstElementChild.dataset.index = user.id;
            userTable.append(newRow);
        }
        const addBtn = document.querySelector('#addBtn');
        addBtn.removeEventListener('click', handlerAddButton);
        addBtn.addEventListener('click', handlerAddButton);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

async function updateUserPanel(user) {
    const userId = document.querySelector('#userId span');
    const userName = document.querySelector('#userName span');
    const userAge = document.querySelector('#userAge span');
    const userEmail = document.querySelector('#userEmail span');
    const userRole = document.querySelector('#userRole span');
    userId.innerText = user.id;
    userName.innerText = user.username;
    userAge.innerText = user.age;
    userEmail.innerText = user.email;
    userRole.innerText = getRoles(user.roles);
}

let rolesMap = {};

async function fetchRoles() {
    try {
        const response = await fetch(URL + `/user/roles`);
        if (!response.ok) throw new Error('Failed to fetch roles');
        const roles = await response.json();
        roles.forEach(role => {
            rolesMap[role.role] = role.id;
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}

document.getElementById('addBtn').addEventListener('click', validateAddForm);

function validateAddForm() {
    const username = document.getElementById('usernameAdd');
    const age = document.getElementById('ageAdd');
    const email = document.getElementById('emailAdd');
    const password = document.getElementById('passwordAdd');
    const roles = document.getElementById('rolesAdd');
    document.getElementById('usernameAddError').innerText = '';
    document.getElementById('ageAddError').innerText = '';
    document.getElementById('emailAddError').innerText = '';
    document.getElementById('passwordAddError').innerText = '';
    document.getElementById('rolesAddError').innerText = '';
    let valid = true;
    if (username.value.trim().length < 3 || username.value.trim().length > 30) {
        document.getElementById('usernameAddError').innerText = "Username must be between 3 and 30 characters.";
        valid = false;
    }

    if (age.value === '' || age.value <= 0) {
        document.getElementById('ageAddError').innerText = "Age should be greater than 0";
        valid = false;
    }

    let re = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!re.test(String(email.value).toLowerCase())) {
        document.getElementById('emailAddError').innerText = "Email is not valid";
        valid = false;
    }
    if (password.value.trim().length < 4 || password.value.trim().length > 100) {
        document.getElementById('passwordAddError').innerText = "Password must be between 4 and 100 characters.";
        valid = false;
    }
    if (Array.from(roles.selectedOptions).length === 0) {
        document.getElementById('rolesAddError').innerText = "At least one role must be selected.";
        valid = false;
    }
    document.getElementById('addBtn').disabled = !valid;
    document.getElementById('usernameAdd').addEventListener('input', validateAddForm);
    document.getElementById('ageAdd').addEventListener('input', validateAddForm);
    document.getElementById('emailAdd').addEventListener('input', validateAddForm);
    document.getElementById('passwordAdd').addEventListener('input', validateAddForm);
    document.getElementById('rolesAdd').addEventListener('input', validateAddForm);
}

document.getElementById('editBtn').addEventListener('click', validateEditForm);

function validateEditForm() {
    const username = document.getElementById('usernameEdit');
    const age = document.getElementById('ageEdit');
    const email = document.getElementById('emailEdit');
    const password = document.getElementById('passwordEdit');
    const roles = document.getElementById('editRoles');
    document.getElementById('usernameError').innerText = '';
    document.getElementById('ageError').innerText = '';
    document.getElementById('emailError').innerText = '';
    document.getElementById('passwordError').innerText = '';
    document.getElementById('rolesError').innerText = '';
    let valid = true;
    if (username.value.trim().length < 3 || username.value.trim().length > 30) {
        document.getElementById('usernameError').innerText = "Username must be between 3 and 30 characters.";
        valid = false;
    }
    if (age.value === '' || age.value <= 0) {
        document.getElementById('ageError').innerText = "Age should be greater than 0";
        valid = false;
    }
    let re = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!re.test(String(email.value).toLowerCase())) {
        document.getElementById('emailError').innerText = "Email is not valid";
        valid = false;
    }
    if (password.value.trim().length < 4 || password.value.trim().length > 100) {
        document.getElementById('passwordError').innerText = "Password must be between 4 and 100 characters.";
        valid = false;
    }
    if (Array.from(roles.selectedOptions).length === 0) {
        document.getElementById('rolesError').innerText = "At least one role must be selected.";
        valid = false;
    }
    document.getElementById('editBtn').disabled = !valid;
    document.getElementById('usernameEdit').addEventListener('input', validateEditForm);
    document.getElementById('ageEdit').addEventListener('input', validateEditForm);
    document.getElementById('emailEdit').addEventListener('input', validateEditForm);
    document.getElementById('passwordEdit').addEventListener('input', validateEditForm);
    document.getElementById('editRoles').addEventListener('input', validateEditForm);
}