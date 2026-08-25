import { Post, PostReactionResponse, ReactionType } from '../types/post';

const REACTION_KEYS: ReactionType[] = [
  'im_here',
  'me_too',
  'you_got_this',
  'love_this',
];

type ReactionCounts = Pick<
  Post,
  'im_here' | 'me_too' | 'you_got_this' | 'love_this' | 'my_reaction'
>;

function countsOf(post: ReactionCounts) {
  return {
    im_here: post.im_here ?? 0,
    me_too: post.me_too ?? 0,
    you_got_this: post.you_got_this ?? 0,
    love_this: post.love_this ?? 0,
  };
}

export function previewReaction<T extends ReactionCounts>(
  post: T,
  type: ReactionType,
): T {
  const counts = countsOf(post);
  const current = post.my_reaction ?? null;

  if (current === type) {
    counts[type] = Math.max(0, counts[type] - 1);
    return { ...post, ...counts, my_reaction: null };
  }

  if (current && REACTION_KEYS.includes(current)) {
    counts[current] = Math.max(0, counts[current] - 1);
  }

  counts[type] = counts[type] + 1;
  return { ...post, ...counts, my_reaction: type };
}

export function mergeReactionResponse<T extends ReactionCounts>(
  post: T,
  response: PostReactionResponse,
): T {
  return {
    ...post,
    im_here: response.im_here,
    me_too: response.me_too,
    you_got_this: response.you_got_this,
    love_this: response.love_this,
    my_reaction: response.my_reaction,
  };
}
