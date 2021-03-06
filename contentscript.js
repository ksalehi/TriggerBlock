const contentStore = {};
let block = ["Trump"];

chrome.storage.sync.get(
  {blockContent: [], disabled: false}, function(items) {
    let toBlock = [];
    items.blockContent.forEach((item) => {
      if (item.split(",")[2] === "true") {
        toBlock.push(item.split(",")[0]);
      }
    });
    block = toBlock;
    if (!items.disabled) {
      walkAndObserve(document);
    }
});

function walk(rootNode)
{
    // Find all the text nodes in rootNode
    var walker = document.createTreeWalker(
        rootNode,
        NodeFilter.SHOW_TEXT,
        null,
        false
    ),
    node;

    // Modify each text node's value
    while (node = walker.nextNode()) {
        handleText(node);
    }
}

function handleText(textNode) {
  block.forEach((string) => {
    let toMatch = new RegExp(string, "i");
    if (textNode.textContent.match(toMatch) &&
          !$(textNode.parentNode).is('script')) {
      findParentContainer(textNode);
      // let parentNode = findParentContainer(textNode);
      // if (!$(parentNode).find('.extension-warning')[0] && parentNode.localName !== 'body') {
      // }
      // let warning = generateWarning(parentNode);
      // $(parentNode).addClass('pos-rel');
      // $(parentNode).append(warning);
    }
  });
}

function findParentContainer(elementNode) {
  // debugger
  const texts = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "body"];
  let node = elementNode.parentNode;
  let searchingForTarget = true;
  let addWarning = true;
  let target;
  while (node) {
    if (node.localName === "body") {
      break;
    }
    if (($(node).css('display') === 'block') &&
        (!texts.includes(node.localName)) &&
        (searchingForTarget)) {
      target = node;
      searchingForTarget = false;
    }
    if ($(node).hasClass("pos-rel")) {
      addWarning = false;
      break;
    }
    node = node.parentNode;
  }
  if (addWarning) {
    generateWarning(target);
  }
}

function generateWarning(parentNode) {
  let warning = $('<div></div>').addClass("extension-warning");
  let lock = $('<div class="lock locked"></div>');

  $(parentNode).append(lock);
  $('.lock').off().on('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleLock(this);
  });
  $(parentNode).addClass('pos-rel');
  $(parentNode).append(warning);
  // return warning;
}

function toggleLock(element) {
  let classes = $(element).attr('class').split(' ');
  if (classes.includes('locked')) {
    $(element).removeClass('locked');
    $(element).addClass('unlocked');
    $(element.parentNode).children('.extension-warning').css("display", "none");
  } else if (classes.includes('unlocked')) {
    $(element).removeClass('unlocked');
    $(element).addClass('locked');
    $(element.parentNode).children('.extension-warning').css("display", "block");
  }
}


// The callback used for the document body and title observers
function observerCallback(mutations) {
    var i;

    mutations.forEach(function(mutation) {
        for (i = 0; i < mutation.addedNodes.length; i++) {
            if (mutation.addedNodes[i].nodeType === 3) {
                // Replace the text for text nodes
                handleText(mutation.addedNodes[i]);
            } else {
                // Otherwise, find text nodes within the given node and replace text
                walk(mutation.addedNodes[i]);
            }
        }
    });
}

// Walk the doc (document) body, replace the title, and observe the body and title
function walkAndObserve(doc) {
    var docTitle = doc.getElementsByTagName('title')[0],
    observerConfig = {
        characterData: true,
        childList: true,
        subtree: true
    },
    bodyObserver, titleObserver;

    // Do the initial text replacements in the document body and title
    walk(doc.body);

    // Observe the body so that we replace text in any added/modified nodes
    bodyObserver = new MutationObserver(observerCallback);
    bodyObserver.observe(doc.body, observerConfig);

    // Observe the title so we can handle any modifications there
    if (docTitle) {
        titleObserver = new MutationObserver(observerCallback);
        titleObserver.observe(docTitle, observerConfig);
    }
}
