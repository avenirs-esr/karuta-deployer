/*
* Fichier JS injecté permettant d'ajouter deux boutons pour imprimer la page au format PDF ou exporter des traces dans un zip
* Comme le fichier JS n'est chargé qu'une seule fois au début, on utilise un MutationObserver pour vérifier
* si on est sur une page sur laquelle on doit placer un bouton. On vérifie ça en regardant la balise dans cette arborescense :
* html > body > div id main-body > div id main-container > div id main-portfolio > div id portoflio-container > div id contenu
* Dans le noeud contenu on retrouve le noeud qui change et qui caractérise la page, div id node_XXXXX class="classeX classeY ..."
* On place le ou les boutons dans le span id menus-XXXX class menus
*/

// Ajoute le bouton "Exporter la page en format PDF" sur la page en question
function addButtonExportToPdfToPage(targetNode) {
    // Si le bouton n'existe pas déjà (pour ne pas le recréer)
    if (!document.querySelector('#printToPDFButton')) {
        const spanParent = targetNode.querySelector('div[id^="sub_node_"].node-header.node.first-node div[id^="std_node_"].node-label div.edit-bar span[id^="menus-"].menus');
        if(spanParent){
            const button = document.createElement('button');
            button.id = 'printToPDFButton';
            // Ouvrir la page impression quand on clique sur le bouton
            button.addEventListener('click', function() {
                window.print();
            });
            button.classList.add('button', 'add-button', 'btn');
            button.textContent = 'Exporter la page en format PDF';
            spanParent.appendChild(button);
        }
    }
}

// Ajoute le bouton "Exporter mes traces dans un ZIP" sur la page des traces
function addButtonExportToZipToPage(targetNode) {
    // Si le bouton n'existe pas déjà (pour ne pas le recréer)
    if (!document.querySelector('#printToZIPButton')) {
        const spanParent = targetNode.querySelector('div[id^="sub_node_"].node-header.node.first-node div[id^="std_node_"].node-label div.edit-bar span[id^="menus-"].menus');
        if(spanParent){
            var divs = document.querySelectorAll("div[id^='portfolio_']");
            const button = document.createElement('button');
            button.id = 'printToZIPButton';
            // Faire un appel vers la bonne URL pour télécharger un ZIP des traces quand on clique sur le bouton
            // g_portfolioid est une variable globale du JS qui contient l'id du portfolio
            // serverBCK_API est une variable globale du JS qui contient l'url de base du backend
            button.addEventListener('click', function() {
                window.location.href = "../../../"+serverBCK_API+"/portfolios/portfolio/"+g_portfolioid+"?resources=true&files=true&traces=true";
            });
            button.classList.add('button', 'add-button', 'btn');
            // Margin pour décoller le bouton de celui des export PDF
            button.style.marginLeft = "5px";
            button.textContent = 'Exporter mes traces dans un ZIP';
            spanParent.appendChild(button);
        }
    }
}


// Trouver si le noeud qu'on cherche est présent dans le DOM = si on est sur la bonne page
// On vérifie les classes à la main car les # ne passent pas dans les sélécteurs CSS
function checkNodesForPage() {
    const nodes = document.querySelectorAll('#main-body #main-container #main-portfolio #portfolio-container #contenu div[id^="node_"]');
    nodes.forEach(node => {
        if (node.classList.contains('standard-node-default') &&
            node.classList.contains('standard') &&
            node.classList.contains('asmUnit') &&
            node.classList.contains('#resourcetype#') &&
            node.classList.contains('#priv#') &&
            node.classList.contains('default')) {
                // Les 2 premières pages de la partie "Mes formations et référentiels"
                if(node.classList.contains('formation-element')){
                    addButtonExportToPdfToPage(node);
                }
                // La page compétences personnalisées coté mes formations et reférentiels
                if(node.classList.contains('Xcompetence-hors-referentiel')){
                    addButtonExportToPdfToPage(node);
                }
                // La page "Mes traces"
                else if(node.classList.contains('page-traces')){
                    addButtonExportToPdfToPage(node);
                    addButtonExportToZipToPage(node);
                }
                // Les pages des SAé
                else if(node.classList.contains('page-action-sae-evaluateurs-etudiant')){
                    addButtonExportToPdfToPage(node);
                }
                // Les pages des Stages et alternances
                else if(node.classList.contains('page-action-stage-evaluateurs-etudiant')){
                    addButtonExportToPdfToPage(node);
                }
                // Les pages des autres actions
                else if(node.classList.contains('page-action-autre')){
                    addButtonExportToPdfToPage(node);
                }
                // La page "Tableau de bord de mes compétences par formation"
                else if(node.classList.contains('page-tableau-bord-competences-formations')){
                    addButtonExportToPdfToPage(node);
                }
                // La page "Tableau de bord compétences personnalisées"
                else if(node.classList.contains('page-tableau-bord-competences-transversales')){
                    addButtonExportToPdfToPage(node);
                }
                // Les bilans par compétence de chaque formation et les compétences personnalisés une par une
                else if(node.classList.contains('page-competence-specification')){
                    addButtonExportToPdfToPage(node);
                }
        }
    });
}

// MutationObserver : vérifie les noeuds de la page à chaque changement dans le DOM HTML
const observer = new MutationObserver(function(mutations) {
    console.log("Changement dans le DOM HTML")
    checkNodesForPage();
});

// Configuration du MutationObserver
const config = { childList: true, subtree: true };

// Noeud observé (ici le body tout entier)
const targetNode = document.body;
observer.observe(targetNode, config);

// On vérifie directement si on a besoin d'ajouter les boutons dans le cas ou on arriverait directement sur la bonne page (ne devrait pas se produire)
checkNodesForPage();