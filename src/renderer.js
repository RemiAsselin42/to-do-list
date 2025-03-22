// Éléments du DOM
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const tasksList = document.getElementById('tasks-list');
const filterAllBtn = document.getElementById('filter-all');
const filterActiveBtn = document.getElementById('filter-active');
const filterCompletedBtn = document.getElementById('filter-completed');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = themeToggleBtn.querySelector('i');

// Éléments de catégorie
const categoryBtn = document.getElementById('category-btn');
const categoryPanel = document.getElementById('category-panel');
const categoryList = document.getElementById('category-list');
const categoryNameInput = document.getElementById('category-name');
const categoryColorInput = document.getElementById('category-color');
const addCategoryBtn = document.getElementById('add-category');

// Éléments du modal pour les tâches
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
let taskToDelete = null;

// Éléments du modal pour les catégories
const deleteCategoryModal = document.getElementById('delete-category-modal');
const confirmDeleteCategoryBtn = document.getElementById('confirm-delete-category');
const cancelDeleteCategoryBtn = document.getElementById('cancel-delete-category');
let categoryToDelete = null;

// Contrôles de fenêtre
document.getElementById('minimize-btn').addEventListener('click', () => {
    window.todoAPI.minimizeWindow();
});

document.getElementById('maximize-btn').addEventListener('click', () => {
    window.todoAPI.maximizeWindow();
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.todoAPI.closeWindow();
});

// Liste des tâches et catégories
let tasks = [];
let categories = [];
let currentFilter = 'all';
let selectedCategories = []; // Au lieu de let selectedCategory = null;

// Chargement initial des tâches et catégories
window.addEventListener('DOMContentLoaded', async () => {
    // Charger les tâches et catégories depuis le stockage
    tasks = await window.todoAPI.getTasks();
    categories = await window.todoAPI.getCategories();
    renderTasks();
    renderCategories();

    // Vérifier le thème préféré stocké
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    updateCategoryButtonState(); // Ajouter cette ligne
});

// Écouter les mises à jour de tâches provenant d'autres fenêtres
window.todoAPI.onTasksUpdated((updatedTasks) => {
    tasks = updatedTasks;
    renderTasks();
});

window.todoAPI.onCategoriesUpdated((updatedCategories) => {
    categories = updatedCategories;
    renderCategories();
});

// Afficher/masquer le panneau des catégories
categoryBtn.addEventListener('click', (e) => {
    // Ne rien faire si le bouton est désactivé
    if (categoryBtn.disabled) {
        e.preventDefault();
        return;
    }

    // Empêcher la propagation pour éviter que le document ne capture l'événement
    e.stopPropagation();

    categoryPanel.classList.toggle('active');
    categoryBtn.classList.toggle('active');
});

// Fermer le panneau des catégories si on clique ailleurs
document.addEventListener('click', (e) => {
    // Ne fermer le panneau que si on clique en dehors du panneau ET en dehors du bouton
    if (!categoryPanel.contains(e.target) && e.target !== categoryBtn) {
        categoryPanel.classList.remove('active');
        categoryBtn.classList.remove('active');
    }
});

// Ajouter une catégorie
addCategoryBtn.addEventListener('click', () => {
    const name = categoryNameInput.value.trim();
    if (!name) return;

    // Vérifier si la longueur est valide
    if (name.length > 15) {
        return;
    }

    // Vérifier si la catégorie existe déjà
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        return;
    }

    const newCategory = {
        id: Date.now(),
        name: name,
        color: categoryColorInput.value
    };

    categories.push(newCategory);
    saveCategories();

    // Réinitialiser les champs
    categoryNameInput.value = '';

    // Rafraîchir la liste des catégories
    renderCategories();
});

// Sauvegarder les catégories
async function saveCategories() {
    await window.todoAPI.saveCategories(categories);
}

// Ajouter cette fonction pour assombrir une couleur 
function darkenColor(hex, percent = 30) {
    // Convertir hex en RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Réduire chaque composante pour assombrir
    r = Math.max(0, Math.floor(r * (100 - percent) / 100));
    g = Math.max(0, Math.floor(g * (100 - percent) / 100));
    b = Math.max(0, Math.floor(b * (100 - percent) / 100));

    // Convertir en hex et retourner
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Modifier la fonction renderCategories 
function renderCategories() {
    categoryList.innerHTML = '';

    // Ajouter les catégories existantes
    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.classList.add('category-item');
        categoryItem.style.backgroundColor = category.color;

        // Vérifier si cette catégorie est dans la liste de sélection
        if (selectedCategories.some(cat => cat.id === category.id)) {
            categoryItem.classList.add('selected');
            // Appliquer un outline de la même couleur mais plus foncé
            const darkerColor = darkenColor(category.color);
            categoryItem.style.outline = `2px solid ${darkerColor}`;
        }

        // Déterminer la couleur du texte en fonction de la luminosité de la couleur de fond
        const color = category.color.substring(1);
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        categoryItem.style.color = brightness > 128 ? '#000000' : '#ffffff';

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('category-name');
        nameSpan.textContent = category.name;

        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fas', 'fa-times', 'category-delete');
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(category.id);
        });

        categoryItem.appendChild(nameSpan);
        categoryItem.appendChild(deleteIcon);

        // Empêcher la propagation du clic sur une catégorie
        categoryItem.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCategory(category);
        });

        categoryList.appendChild(categoryItem);
    });
}

// Sélectionner une catégorie
function selectCategory(category) {
    if (!category) {
        // Si null est passé, réinitialiser la sélection
        selectedCategories = [];
    } else {
        // Vérifier si la catégorie est déjà sélectionnée
        const index = selectedCategories.findIndex(cat => cat.id === category.id);
        if (index !== -1) {
            // Si déjà sélectionnée, la retirer
            selectedCategories.splice(index, 1);
        } else {
            // Sinon, l'ajouter
            selectedCategories.push(category);
        }
    }

    // Mettre à jour l'affichage des catégories
    renderCategories();

    // Mettre à jour l'icône du bouton de catégorie
    updateCategoryButtonIcon();
}

// Nouvelle fonction pour mettre à jour l'icône du bouton de catégorie
function updateCategoryButtonIcon() {
    if (selectedCategories.length === 0) {
        categoryBtn.innerHTML = `<i class="fas fa-tag"></i>`;
    } else {
        categoryBtn.innerHTML = `<i class="fas fa-tags"></i> ${selectedCategories.length}`;
    }
}

// Supprimer une catégorie
function deleteCategory(id) {
    // Stocker l'ID de la catégorie à supprimer
    categoryToDelete = id;

    // Afficher le modal de confirmation
    deleteCategoryModal.classList.add('active');
}

// Confirmer la suppression de catégorie
confirmDeleteCategoryBtn.addEventListener('click', () => {
    if (categoryToDelete !== null) {
        // Mise à jour pour les tâches ayant des catégories multiples
        tasks = tasks.map(task => {
            if (task.categories) {
                // Filtrer la catégorie supprimée des listes de catégories
                task.categories = task.categories.filter(cat => cat.id !== categoryToDelete);
                if (task.categories.length === 0) {
                    task.categories = null;
                }
                return task;
            } else if (task.category && task.category.id === categoryToDelete) {
                // Compatibilité avec l'ancien format
                return { ...task, category: null };
            }
            return task;
        });

        // Supprimer la catégorie
        categories = categories.filter(cat => cat.id !== categoryToDelete);

        // Si la catégorie supprimée était dans la sélection, la retirer
        const index = selectedCategories.findIndex(cat => cat.id === categoryToDelete);
        if (index !== -1) {
            selectedCategories.splice(index, 1);
            updateCategoryButtonIcon();
        }

        // Sauvegarder les changements
        saveCategories();
        saveAndRenderTasks();

        // Réinitialiser et fermer le modal
        categoryToDelete = null;
        deleteCategoryModal.classList.remove('active');
    }
});

// Annuler la suppression de catégorie
cancelDeleteCategoryBtn.addEventListener('click', () => {
    // Réinitialiser et fermer le modal
    categoryToDelete = null;
    deleteCategoryModal.classList.remove('active');
});

// Fermer le modal si on clique en dehors
deleteCategoryModal.addEventListener('click', (e) => {
    if (e.target === deleteCategoryModal) {
        categoryToDelete = null;
        deleteCategoryModal.classList.remove('active');
    }
});

// Ajouter une tâche
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function addTask() {
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        categories: selectedCategories.length > 0 ? [...selectedCategories] : null
    };

    // Utiliser unshift au lieu de push pour ajouter au début du tableau
    tasks.unshift(newTask);
    saveAndRenderTasks();
    taskInput.value = '';
    taskInput.focus();

    // Réinitialiser les catégories sélectionnées
    selectCategory(null);

    // Mettre à jour l'état du bouton de catégorie
    updateCategoryButtonState();

    // Fermer le panneau des catégories
    categoryPanel.classList.remove('active');
    categoryBtn.classList.remove('active');
}

// Afficher les tâches selon le filtre actuel
function renderTasks() {
    tasksList.innerHTML = '';

    const filteredTasks = filterTasks();

    filteredTasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        taskElement.dataset.id = task.id; // Ajouter l'ID comme attribut de données
        taskElement.draggable = true; // Rendre l'élément glissable

        // Ajouter la poignée de glisser
        const dragHandle = document.createElement('div');
        dragHandle.classList.add('drag-handle');
        dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('task-checkbox');
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

        const taskText = document.createElement('div');
        taskText.classList.add('task-text');
        if (task.completed) taskText.classList.add('completed');
        taskText.textContent = task.text;

        // Gérer l'affichage des catégories multiples
        // ...code existant pour les catégories...

        if (task.categories && task.categories.length > 0) {
            // Pour la compatibilité avec les anciennes tâches qui ont une seule catégorie
            const categoriesToDisplay = Array.isArray(task.categories) ? task.categories : [task.category];

            categoriesToDisplay.forEach(category => {
                if (!category) return;

                const categoryTag = document.createElement('span');
                categoryTag.classList.add('task-category');
                categoryTag.textContent = category.name;
                categoryTag.style.backgroundColor = category.color;

                // Déterminer la couleur du texte
                const color = category.color.substring(1);
                const r = parseInt(color.substr(0, 2), 16);
                const g = parseInt(color.substr(2, 2), 16);
                const b = parseInt(color.substr(4, 2), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                categoryTag.style.color = brightness > 128 ? '#000000' : '#ffffff';

                taskText.appendChild(categoryTag);
            });
        } else if (task.category) {
            // Compatibilité avec l'ancien format (une seule catégorie)
            const categoryTag = document.createElement('span');
            categoryTag.classList.add('task-category');
            categoryTag.textContent = task.category.name;
            categoryTag.style.backgroundColor = task.category.color;

            // Déterminer la couleur du texte
            const color = task.category.color.substring(1);
            const r = parseInt(color.substr(0, 2), 16);
            const g = parseInt(color.substr(2, 2), 16);
            const b = parseInt(color.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            categoryTag.style.color = brightness > 128 ? '#000000' : '#ffffff';

            taskText.appendChild(categoryTag);
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        // Ajouter tous les éléments au taskElement
        taskElement.appendChild(dragHandle);
        taskElement.appendChild(checkbox);
        taskElement.appendChild(taskText);
        taskElement.appendChild(deleteBtn);

        // Ajouter les événements de drag and drop
        taskElement.addEventListener('dragstart', handleDragStart);
        taskElement.addEventListener('dragend', handleDragEnd);

        // Ajouter une animation pour les éléments qui se déplacent
        setTimeout(() => {
            taskElement.classList.add('moved');
            // Supprimer la classe après la fin de l'animation
            setTimeout(() => {
                taskElement.classList.remove('moved');
            }, 300);
        }, index * 50); // Délai échelonné pour chaque élément

        tasksList.appendChild(taskElement);
    });

    // Ajouter les événements de drag and drop au conteneur de tâches
    tasksList.addEventListener('dragover', handleDragOver);
    tasksList.addEventListener('dragenter', handleDragEnter);
    tasksList.addEventListener('dragleave', handleDragLeave);
    tasksList.addEventListener('drop', handleDrop);
}

// Filtrer les tâches selon le filtre actuel
function filterTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return [...tasks];
    }
}

// Basculer le statut d'une tâche
function toggleTaskStatus(id) {
    const taskBeforeToggle = tasks.find(task => task.id === id);
    const wasCompleted = taskBeforeToggle.completed;

    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );

    // Si la tâche vient d'être marquée comme complétée (et n'était pas déjà complétée)
    if (!wasCompleted) {
        // Lancer l'animation de confettis
        triggerConfetti();
    }

    saveAndRenderTasks();
}

// Fonction pour déclencher l'animation de confettis
function triggerConfetti() {
    // Configuration des confettis - explosion venant du bas de l'écran
    const count = 200;
    const defaults = {
        origin: { y: 1 },
        gravity: 0.7,
        spread: 100,
        ticks: 150,
        shapes: ['square', 'circle'],
        scalar: 1
    };

    // Animation principale - avec des couleurs vives
    confetti({
        ...defaults,
        particleCount: count * 0.25,
        colors: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'],
        scalar: 1.2
    });

    // Délai court pour un effet de vague
    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: count * 0.2,
            colors: ['#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7'],
            scalar: 1.1
        });
    }, 100);

    // Dernier jet pour un effet encore plus riche
    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: count * 0.35,
            colors: ['#540d6e', '#ee4266', '#ffd23f', '#3bceac', '#0ead69'],
            scalar: 0.9
        });
    }, 200);
}

// Supprimer une tâche avec confirmation
function deleteTask(id) {
    // Stocker l'ID de la tâche à supprimer
    taskToDelete = id;

    // Afficher le modal de confirmation
    deleteModal.classList.add('active');
}

// Confirmer la suppression
confirmDeleteBtn.addEventListener('click', () => {
    if (taskToDelete !== null) {
        // Supprimer la tâche
        tasks = tasks.filter(task => task.id !== taskToDelete);
        saveAndRenderTasks();

        // Réinitialiser et fermer le modal
        taskToDelete = null;
        deleteModal.classList.remove('active');
    }
});

// Annuler la suppression
cancelDeleteBtn.addEventListener('click', () => {
    // Réinitialiser et fermer le modal
    taskToDelete = null;
    deleteModal.classList.remove('active');
});

// Fermer le modal si on clique en dehors
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        taskToDelete = null;
        deleteModal.classList.remove('active');
    }
});

// Sauvegarder et rafraîchir l'affichage
async function saveAndRenderTasks() {
    await window.todoAPI.saveTasks(tasks);
    // renderTasks() sera appelé via l'événement tasks-updated
}

// Filtres
filterAllBtn.addEventListener('click', () => setFilter('all'));
filterActiveBtn.addEventListener('click', () => setFilter('active'));
filterCompletedBtn.addEventListener('click', () => setFilter('completed'));

function setFilter(filter) {
    currentFilter = filter;

    // Mettre à jour les boutons actifs
    [filterAllBtn, filterActiveBtn, filterCompletedBtn].forEach(btn => {
        btn.classList.remove('active');
    });

    switch (filter) {
        case 'active':
            filterActiveBtn.classList.add('active');
            break;
        case 'completed':
            filterCompletedBtn.classList.add('active');
            break;
        default:
            filterAllBtn.classList.add('active');
    }

    renderTasks();
}

// Bascule du thème
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.body.removeAttribute('data-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});

// Fonction pour mettre à jour l'état du bouton de catégorie
function updateCategoryButtonState() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        categoryBtn.disabled = true;
        categoryBtn.classList.add('disabled');

        // Si le panneau est ouvert, le fermer
        if (categoryPanel.classList.contains('active')) {
            categoryPanel.classList.remove('active');
            categoryBtn.classList.remove('active');
        }
    } else {
        categoryBtn.disabled = false;
        categoryBtn.classList.remove('disabled');
    }
}

// Ajouter un écouteur pour surveiller les changements dans l'input
taskInput.addEventListener('input', updateCategoryButtonState);

// Variables pour le drag and drop
let draggedTask = null;
let draggedElement = null;

// Fonction appelée lorsqu'on commence à faire glisser une tâche
function handleDragStart(e) {
    draggedElement = this;
    draggedTask = tasks.find(task => task.id === parseInt(this.dataset.id));

    // Ajouter un délai pour que la classe soit appliquée après la saisie de l'élément
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);

    // Définir les données à transférer (requis pour Firefox)
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);

    // Rendre semi-transparent pendant le drag
    this.style.opacity = '0.6';
}

// Fonction appelée lorsqu'on termine le glissement
function handleDragEnd(e) {
    this.classList.remove('dragging');
    this.style.opacity = '1';

    // Réinitialiser la visualisation du drop
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.classList.remove('drag-over');
    });

    draggedElement = null;
    draggedTask = null;
}

// Fonction appelée lorsqu'on survole une zone de drop
function handleDragOver(e) {
    e.preventDefault(); // Nécessaire pour permettre le drop

    // Trouver la cible et mettre à jour les styles
    const targetElement = findDragTarget(e);

    // Réinitialiser tous les éléments
    document.querySelectorAll('.task-item').forEach(item => {
        if (item !== draggedElement) {
            item.classList.remove('drag-over');
        }
    });

    // Ajouter la classe à l'élément cible uniquement
    if (targetElement && targetElement !== draggedElement) {
        targetElement.classList.add('drag-over');
    }

    return false;
}

// Fonction appelée lorsqu'on entre dans une zone de drop
function handleDragEnter(e) {
    e.preventDefault();
}

// Fonction appelée lorsqu'on quitte une zone de drop
function handleDragLeave(e) {
    // Ne rien faire ici car nous gérons tout dans handleDragOver
}

// Fonction appelée lorsqu'on lâche l'élément sur une zone de drop
function handleDrop(e) {
    e.preventDefault();

    // Trouver l'élément cible avec notre fonction améliorée
    const targetElement = findDragTarget(e);

    // Réinitialiser les styles
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });

    if (targetElement && targetElement !== draggedElement && draggedTask) {
        // Trouver l'index de la tâche cible
        const targetId = parseInt(targetElement.dataset.id);
        const targetTask = tasks.find(task => task.id === targetId);

        if (targetTask) {
            const targetIndex = tasks.indexOf(targetTask);
            const draggedIndex = tasks.indexOf(draggedTask);

            // Réorganiser les tâches seulement si les deux index sont valides
            if (targetIndex !== -1 && draggedIndex !== -1) {
                tasks.splice(draggedIndex, 1); // Retirer la tâche glissée
                tasks.splice(targetIndex, 0, draggedTask); // Insérer à la nouvelle position

                // Enregistrer et rafraîchir
                saveAndRenderTasks();
            }
        }
    }

    return false;
}

// Fonction utilitaire pour trouver l'élément de tâche le plus proche
function findDragTarget(e) {
    // D'abord, essayer de trouver directement l'élément tâche sous le curseur
    let targetElement = e.target.closest('.task-item');

    // Si aucun élément n'est trouvé directement, chercher en utilisant les coordonnées
    if (!targetElement) {
        // Obtenir tous les éléments de tâche
        const taskItems = document.querySelectorAll('.task-item');

        // Parcourir tous les éléments de tâche pour trouver le plus proche
        taskItems.forEach(item => {
            const rect = item.getBoundingClientRect();

            // Vérifier si la position du curseur est à l'intérieur des limites de l'élément ou proche
            // Agrandir virtuellement la zone de détection de 20px
            if (
                e.clientX >= rect.left - 20 &&
                e.clientX <= rect.right + 20 &&
                e.clientY >= rect.top - 20 &&
                e.clientY <= rect.bottom + 20
            ) {
                targetElement = item;
            }
        });
    }

    return targetElement;
}