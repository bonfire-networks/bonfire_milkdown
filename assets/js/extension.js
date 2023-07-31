import { defaultValueCtx, editorViewOptionsCtx, Editor, editorViewCtx, commandsCtx, rootCtx } from '@milkdown/core';
import { insert, $command, callCommand } from '@milkdown/utils';
import { commonmark, wrapInHeadingCommand, toggleStrongCommand, toggleEmphasisCommand} from '@milkdown/preset-commonmark';
import { emoji } from '@milkdown/plugin-emoji';
import {placeholder, placeholderCtx} from 'milkdown-plugin-placeholder';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { SlashProvider } from '@milkdown/plugin-slash'
import { slashFactory } from '@milkdown/plugin-slash';
// import { nord } from '@milkdown/theme-nord';
import { gemoji } from "gemoji";

console.log('Milkdown Vanilla Shiki Highlight loaded');
const MIN_PREFIX_LENGTH = 2
const VALID_CHARS = '[\\w\\+_\\-:]'
const MENTION_PREFIX = '(?:@)'
const EMOJI_PREFIX = '(?::)'
const MENTION_REGEX = new RegExp(`(?:\\s|^)(${MENTION_PREFIX}${VALID_CHARS}{${MIN_PREFIX_LENGTH},})$`)
const EMOJI_REGEX = new RegExp(`(?:\\s|^)(${EMOJI_PREFIX}${VALID_CHARS}{${MIN_PREFIX_LENGTH},})$`)


import '@milkdown/theme-nord/style.css';

const markdown = ``

let MilkdownHooks = {};


function mentionsPluginView(view) {
  const content = document.createElement('ul');
  content.tabIndex = 1;

  content.className = 'm-0 p-0 menu w-72 bg-base-100 shadow-lg ring-2';
  let list = ''

  const provider = new SlashProvider({
    content,
    shouldShow: (view, prevState) => {
      // get the current content of the editor
      const { state } = view;
      const { doc } = state;
      const currentText = doc.textContent;

      if (currentText === '') {
        return false;
      }
      

      const mentions = currentText.match(MENTION_REGEX)

      // Display the menu if the last character is `@` followed by 2 chars.
      if (mentions) {
        // get the characters that follows the `@` in currentText
        const text = mentions[1].split('@').pop()

        return getFeedItems(text, '@').then(res => {
          list = ''
          if (res.length > 0) {
            // Add max 4 items to the menu
            let maxItems = 4
            for (let i = 0; i < res.length && i < maxItems; i++) {
              list += mentionItemRenderer(res[i], text);
            }
            content.innerHTML = list
            return true
          } else {
            content.innerHTML = ''
            return false
          }
          })
        }
  
      return false;
    },
    trigger: '@',
  });

  return {
    update: (updatedView, prevState) => {
      console.log("UPDATE")
      console.log(updatedView)
      console.log(prevState)
      provider.update(updatedView, prevState);
    },
    destroy: () => {
      console.log("destroy")
      provider.destroy();
      content.remove();
    }
  }
}


function emojisPluginView() {
  const content = document.createElement('ul');
  content.tabIndex = 1;

  content.className = 'm-0 p-0 menu w-72 bg-base-100 shadow-lg ring-2';
  let list = ''
      
  const provider = new SlashProvider({
    content,
    shouldShow: (view, prevState) => {
      // get the current content of the editor
      const { state } = view;
      const { doc } = state;
      const currentText = doc.textContent;

      if (currentText === '') {
        return false;
      }


      const emojis = currentText.match(EMOJI_REGEX)
      // Display the menu if the last character is `@` followed by 2 chars.
      if (emojis) {
        // get the characters that follows the `@` in currentText
        const text = emojis[1].split(':').pop()
        const index = gemoji.findIndex((emoji) => {
          return emoji.names.some((name) => name.includes(text));
        });
        list = ''
        if (index > 0) {
          // Add max 4 items to the menu
          gemoji
          .filter((emoji) => {
            return emoji.names.some((name) => name.includes(text));
          })
          .slice(0, 4)
          .map((emoji) => {
            list += emojiItemRenderer(emoji, text);
          })
          
          content.innerHTML = list
          return true
        } else {
          content.innerHTML = ''
          return false
        }
      }
      return false;
    },
    trigger: ':',
  });


  return {
    update: (updatedView, prevState) => {
      provider.update(updatedView, prevState);
    },
    destroy: () => {
      provider.destroy();
      content.remove();
    }
  }
}


// function slashPluginView(view) {
//   const content = document.createElement('ul');
//   content.tabIndex = 1;

//   content.className = 'm-0 p-0 menu w-72 bg-base-100 shadow-lg ring-2';
//   let list = slashItemRenderer()
//   content.innerHTML = list


//   const provider = new SlashProvider({
//     content,
//     trigger: '/',
//   });



//   return {
//     update: (updatedView, prevState) => {
//       provider.update(updatedView, prevState);
//     },
//     destroy: () => {
//       provider.destroy();
//       content.remove();
//     }
//   }
// }



function getFeedItems(queryText, prefix) {
  // console.log(prefix)
  if (queryText && queryText.length > 0) {
    return new Promise((resolve) => {
      // this requires the bonfire_tag extension
      fetch("/api/tag/autocomplete/ck5/" + prefix + "/" + queryText)
        .then((response) => response.json())
        .then((data) => {
          console.log("data")
          console.log(data)
          let values = data.map((item) => ({
            id: item.id,
            value: item.name,
            link: item.link,
          }));
          resolve(values);
        })
        .catch((error) => {
          console.error("There has been a problem with the tag search:", error);
          resolve([]);
        });
    });
  } else return [];
}

const mentionItemRenderer = (item, text) => {
  return `
    <li class="rounded-none">
      <button type="button" data-mention="${item.id}" data-text="${text}" class="mention_btn rounded-none w-full flex items-center">
        <div class="flex items-center gap-3 w-full pointer-events-none">
          <div class="flex-shrink-0">
            <img class="h-6 w-6 rounded-full" src="https://picsum.photos/80" alt="">
          </div>
          <div class="gap-0 items-start flex flex-col" data-id="${item.id}" data-input="${text}">
            <div class="text-sm truncate max-w-[240px] text-base-content font-semibold">${item.value}</div>
            <div class="text-xs truncate max-w-[240px] text-base-content/70 font-regular">${item.id}</div>
          </div>
        </div>
      </button>
    </li>`
}

const emojiItemRenderer = (item, text) => {

  return `
    <li class="rounded-none">
      <button type="button" data-text="${text}" data-emoji=${item.emoji} class="emoji_btn gap-3 rounded-none w-full flex items-center">
        <div class="pointer-events-none flex items-baseline w-full gap-2">
          <span>${item.emoji}</span> </span>:${item.names[0]}:</span>
        </div>
      </button>
    </li>`
}

// const slashItemRenderer = () => {
//   return `
//     <li class="rounded-none">
//       <button type="button" class="heading_btn rounded-none flex items-center gap-2">
//         <span class="pointer-events-none material-symbols-outlined text-nord-10 dark:text-nord-9">
//           <svg class="w-5 h-5 shrink-0 flex-1 text-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 17q-.425 0-.713-.288T5 16V8q0-.425.288-.713T6 7q.425 0 .713.288T7 8v3h4V8q0-.425.288-.713T12 7q.425 0 .713.288T13 8v8q0 .425-.288.713T12 17q-.425 0-.713-.288T11 16v-3H7v3q0 .425-.288.713T6 17Zm12 0q-.425 0-.713-.288T17 16V9h-1q-.425 0-.713-.288T15 8q0-.425.288-.713T16 7h2q.425 0 .713.288T19 8v8q0 .425-.288.713T18 17Z"/></svg>
//         </span>
//         Heading
//       </button>
//     </li>
//     <li class="rounded-none">
//       <button type="button" class="bold_btn rounded-none flex items-center gap-2">
//         <span class="material-symbols-outlined text-nord-10 dark:text-nord-9">
//           <svg class="w-5 h-5 shrink-0 flex-1 text-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 17q-.425 0-.713-.288T5 16V8q0-.425.288-.713T6 7q.425 0 .713.288T7 8v3h4V8q0-.425.288-.713T12 7q.425 0 .713.288T13 8v8q0 .425-.288.713T12 17q-.425 0-.713-.288T11 16v-3H7v3q0 .425-.288.713T6 17Zm12 0q-.425 0-.713-.288T17 16V9h-1q-.425 0-.713-.288T15 8q0-.425.288-.713T16 7h2q.425 0 .713.288T19 8v8q0 .425-.288.713T18 17Z"/></svg>
//         </span>
//         Bold
//       </button>
//     </li>
//     <li class="rounded-none">
//       <button type="button"  class="italic_btn rounded-none flex items-center gap-2">
//         <span class="material-symbols-outlined text-nord-10 dark:text-nord-9">
//           <svg class="w-5 h-5 shrink-0 flex-1 text-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 17q-.425 0-.713-.288T5 16V8q0-.425.288-.713T6 7q.425 0 .713.288T7 8v3h4V8q0-.425.288-.713T12 7q.425 0 .713.288T13 8v8q0 .425-.288.713T12 17q-.425 0-.713-.288T11 16v-3H7v3q0 .425-.288.713T6 17Zm12 0q-.425 0-.713-.288T17 16V9h-1q-.425 0-.713-.288T15 8q0-.425.288-.713T16 7h2q.425 0 .713.288T19 8v8q0 .425-.288.713T18 17Z"/></svg>
//         </span>
//         Italic
//       </button>
//     </li>
//     <li class="rounded-none">
//       <button  type="button"  class="link_btn rounded-none flex items-center gap-2">
//         <span class="material-symbols-outlined text-nord-10 dark:text-nord-9">
//           <svg class="w-5 h-5 shrink-0 flex-1 text-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6 17q-.425 0-.713-.288T5 16V8q0-.425.288-.713T6 7q.425 0 .713.288T7 8v3h4V8q0-.425.288-.713T12 7q.425 0 .713.288T13 8v8q0 .425-.288.713T12 17q-.425 0-.713-.288T11 16v-3H7v3q0 .425-.288.713T6 17Zm12 0q-.425 0-.713-.288T17 16V9h-1q-.425 0-.713-.288T15 8q0-.425.288-.713T16 7h2q.425 0 .713.288T19 8v8q0 .425-.288.713T18 17Z"/></svg>
//         </span>
//         Link
//       </button>
//     </li>
    
//     <li class="rounded-none">
//       <button type="button"  class="divider_btn rounded-none flex items-center gap-2">
//         <span class="material-symbols-outlined text-nord-10 dark:text-nord-9">
//           <svg class="w-5 h-5 shrink-0 flex-1 text-info"  xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15"><path fill="currentColor" fill-rule="evenodd" d="M2 7.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1h-10a.5.5 0 0 1-.5-.5Z" clip-rule="evenodd"/></svg>
//         </span>
//         Divider
//       </button>
//     </li>
//     `
    
// }



const mentionSlash = slashFactory('mentions-slash');
const emojisSlash = slashFactory('emojis-slash');
// const slash = slashFactory('slash');

const createEditor = async (hidden_input, composer$) => {
  const editor = await Editor
  .make()
  .config(ctx => {
    ctx.set(rootCtx, '#editor')
    ctx.set(defaultValueCtx, markdown)
    // ctx.set(placeholderCtx, 'Type something here...')
    ctx.set(mentionSlash.key, {
      view: mentionsPluginView
    })
    ctx.set(emojisSlash.key, {
      
      view: emojisPluginView
    })
    // ctx.set(slash.key, {
    //   view: slashPluginView
    // })
    ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
      output = markdown;
      hidden_input.value = markdown;
    })
    ctx.update(editorViewOptionsCtx, (prev) => ({
      ...prev,
      attributes: { placeholder: "Type your text here...",  class: 'editor prose prose-sm h-full p-2 focus:outline-none composer', spellcheck: 'false' },
    }))
  })
  // .config(nord)
  .use(commonmark)
  .use(emoji)
  .use(listener)
  // .use(placeholder)
  .use(mentionSlash)
  .use(emojisSlash)
  // .use(slash)
  .create()
 
  
  // const addEmojiCommand = $commandsCtx('AddEmoji', (ctx) => {

  // })
  // editor.action((ctx) => {
  //   console.log("qui")
  //   console.log(composer$)
  // })

  composer$.addEventListener('click', (e) => {
    if (e.target.matches('.emoji_btn')) {
      e.preventDefault();
      const emoji = e.target.dataset.emoji;
      const text = e.target.dataset.text 
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state } = view;
        const { selection } = state;
        view.dispatch(
          view.state.tr
            .delete(selection.from - text.length - 1, selection.from)
            .insertText(emoji + ' ')
        );
        view.focus()
      })
    }

    if (e.target.matches('.mention_btn')) {
      e.preventDefault();
      const mention = e.target.dataset.mention;
      const text = e.target.dataset.text 
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state } = view;
        const { selection } = state;
        view.dispatch(
          view.state.tr
            .delete(selection.from - text.length - 1, selection.from)
            .insertText(mention + ' ')
        );
        view.focus()
      })
    }


    // if (e.target.matches('.heading_btn')) {
    //   e.preventDefault();
    //   editor.action((ctx) => {
    //     // get command manager
    //     const commandManager = ctx.get(commandsCtx);
    //     const view = ctx.get(editorViewCtx);
    //     const { state } = view;
    //     const { selection } = state;
    //     view.dispatch(
    //       view.state.tr
    //         .delete(selection.from - 1, selection.from)
    //     );
    //     // call command
    //     commandManager.call(wrapInHeadingCommand.key, 3);
    //     view.focus()
    //   });
    // }

    // if (e.target.matches('.bold_btn')) {
    //   e.preventDefault();
    //   editor.action((ctx) => {
    //     // get command manager
    //     const commandManager = ctx.get(commandsCtx);
    //     const view = ctx.get(editorViewCtx);
    //     const { state } = view;
    //     const { selection } = state;
    //     view.dispatch(
    //       view.state.tr
    //         .delete(selection.from - 1, selection.from)
    //     );
    //     // call command
    //     commandManager.call(toggleStrongCommand.key);
    //     view.focus()
    //   });
    // }

    // if (e.target.matches('.italic_btn')) {
    //   e.preventDefault();
    //   editor.action((ctx) => {
    //     // get command manager
    //     const commandManager = ctx.get(commandsCtx);
    //     const view = ctx.get(editorViewCtx);
    //     const { state } = view;
    //     const { selection } = state;
    //     view.dispatch(
    //       view.state.tr
    //         .delete(selection.from - 1, selection.from)
    //     );
    //     // call command
    //     commandManager.call(toggleEmphasisCommand.key);
    //     view.focus()
    //   });
    // }


  })

  return editor;
}

MilkdownHooks.Milkdown = {
  mounted() {
    const hidden_input = this.el.querySelector('.editor_hidden_input');
    const composer$ = this.el
    createEditor(hidden_input, composer$)
  },
  updated() {
    console.log("updated")
  }
}


export { MilkdownHooks } 