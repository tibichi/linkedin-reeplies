function addGenerateButton() {
  const commentContainers = document.querySelectorAll('.feed-shared-update-v2, .feed-shared-update-detail-viewer__right-panel');
  
  commentContainers.forEach(postContainer => {
    const commentBoxes = postContainer.querySelectorAll('.comments-comment-box__detour-container');

    if (commentBoxes.length > 0) {
      const firstCommentBox = commentBoxes[0];
      if (!firstCommentBox.querySelector('.generate-comment-btn')) {
        const generateButton = document.createElement('button');
        generateButton.className = 'generate-comment-btn comments-comment-box__detour-icons artdeco-button artdeco-button--circle artdeco-button--muted artdeco-button--2 artdeco-button--tertiary';
        generateButton.setAttribute('aria-label', 'Generate comment');
        generateButton.setAttribute('title', 'Generate comment');
        generateButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-windmill">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2c3.292 0 6 2.435 6 5.5c0 1.337 -.515 2.554 -1.369 3.5h4.369a1 1 0 0 1 1 1c0 3.292 -2.435 6 -5.5 6c-1.336 0 -2.553 -.515 -3.5 -1.368v4.368a1 1 0 0 1 -1 1c-3.292 0 -6 -2.435 -6 -5.5c0 -1.336 .515 -2.553 1.368 -3.5h-4.368a1 1 0 0 1 -1 -1c0 -3.292 2.435 -6 5.5 -6c1.337 0 2.554 .515 3.5 1.369v-4.369a1 1 0 0 1 1 -1z" />
          </svg>
        `;
        generateButton.addEventListener('click', generateComment);
        firstCommentBox.appendChild(generateButton);
      }
    }
  });
}

async function generateComment(event) {
  event.preventDefault();
  const button = event.target.closest('.generate-comment-btn');
  const icon = button.querySelector('svg');
  const commentBox = event.target.closest('.comments-comment-box__form').querySelector('.ql-editor');

  // Add loading class to icon
  icon.classList.add('reeplies-loading');

  // Extract post content and author
  const postContainer = event.target.closest('.feed-shared-update-v2, .feed-shared-update-detail-viewer__right-panel');
  let postContentElement = postContainer.querySelector('.update-components-text');
  let postAuthorElement = postContainer.querySelector('.update-components-actor__name');

  const postContent = postContentElement ? postContentElement.innerText.trim() : '';
  const postAuthor = postAuthorElement ? postAuthorElement.innerText.trim() : '';

  if (!postContent || !postAuthor) {
    console.error('Post content or author not found');
    commentBox.innerHTML = `<p>Error: Post content or author not found</p>`;
    icon.classList.remove('reeplies-loading');
    return;
  }

  try {
    // Ensure the AI API is available
    if (!self.ai || !self.ai.languageModel) {
      throw new Error("AI API is not available in this browser.");
    }

    // Create a language model session with temperature and topK
    const session = await self.ai.languageModel.create({
      systemPrompt: `Craft an engaging comment for this LinkedIn post. Tone should be casual/conversational and limited to 25 words. Insert 1 appropriate emoji (not the one in author's name). Use @${postAuthor} in the comment (author's full name - including emojis and @). Please provide only the comment without options, tags or any other extra explanations, for:`,
      temperature: 0.7, // Creativity level
      topK: 80,        // Limits randomness
    });

    // Prompt the AI for a comment
    const prompt = `${postContent}`;
    const response = await session.prompt(prompt);

    // Set the generated comment
    commentBox.innerHTML = `<p>${response}</p>`;

    // Trigger input event to activate the "Post" button
    commentBox.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    console.error('Error generating comment:', error);
    commentBox.innerHTML = `<p>Error generating comment: ${error.message}</p>`;
  } finally {
    // Remove loading class from icon
    icon.classList.remove('reeplies-loading');
  }
}

// Initial call to add buttons
addGenerateButton();

// Use a MutationObserver to watch for new comment boxes
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      addGenerateButton();
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Add CSS for loading animation
const style = document.createElement('style');
style.innerHTML = `
  .icons-tabler-filled {
    fill: #0a66c2;
  }

  .reeplies-loading {
    filter: grayscale(100%);
    animation: rotate 2s linear infinite;
    opacity: .5;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
