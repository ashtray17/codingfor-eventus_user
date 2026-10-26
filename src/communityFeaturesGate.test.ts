import { describe, expect, it } from 'vitest';
import boardLayout from '../layouts/board.json';
import postLayout from '../layouts/post.json';
import writeLayout from '../layouts/write.json';

type AnyNode = Record<string, any>;

function findById(nodes: AnyNode[] | undefined, id: string): AnyNode | undefined {
  for (const node of nodes ?? []) {
    if (node?.id === id) return node;
    const found = findById(node?.children as AnyNode[] | undefined, id);
    if (found) return found;
  }
  return undefined;
}

describe('Community v0.2.0 functional completion gates', () => {
  it('board.json passes category filter param and renders category filter chips', () => {
    const postsDs = ((boardLayout as AnyNode).data_sources as AnyNode[]).find(
      (ds) => ds.id === 'posts'
    );
    expect(postsDs?.params?.category).toBe("{{query.category ?? ''}}");

    const catBar = findById(
      (boardLayout as AnyNode).slots?.content as AnyNode[],
      'board_categories'
    );
    expect(catBar).toBeDefined();
    expect(findById([catBar!], 'board_category_all')?.name).toBe('Button');
    expect(findById([catBar!], 'board_category_item_{{category_item}}')?.name).toBe('Button');
  });

  it('post.json includes board_posts continuous navigation and post/comment CRUD actions', () => {
    const dataSources = (postLayout as AnyNode).data_sources as AnyNode[];
    const boardPostsDs = dataSources.find((ds) => ds.id === 'board_posts');
    expect(boardPostsDs?.endpoint).toBe('/api/modules/sirsoft-board/boards/{{route.slug}}/posts');
    expect(boardPostsDs?.auth_mode).toBe('optional');

    const contentNodes = (postLayout as AnyNode).slots?.content as AnyNode[];
    expect(findById(contentNodes, 'btn_delete')).toBeDefined();
    expect(findById(contentNodes, 'btn_delete_confirm')).toBeDefined();
    expect(findById(contentNodes, 'comment_edit_btn_{{comment.id}}')).toBeDefined();
    expect(findById(contentNodes, 'comment_delete_btn_{{comment.id}}')).toBeDefined();
    expect(findById(contentNodes, 'comment_edit_save_{{comment.id}}')).toBeDefined();
    expect(findById(contentNodes, 'post_board_list_section')).toBeDefined();
  });

  it('write.json embeds ImageUploader targeting textarea[name="content"] and auto-detects html content_mode', () => {
    const contentNodes = (writeLayout as AnyNode).slots?.content as AnyNode[];
    const uploader = findById(contentNodes, 'write_image_uploader');
    expect(uploader?.name).toBe('ImageUploader');
    expect(uploader?.props?.targetTextareaSelector).toBe("textarea[name='content']");

    const submitBtn = findById(contentNodes, 'write_submit');
    const clickSeq = (submitBtn?.actions as AnyNode[])?.find((a) => a.type === 'click');
    const apiCall = (clickSeq?.actions as AnyNode[])?.find((a) => a.handler === 'apiCall');
    expect(String(apiCall?.params?.body?.content_mode ?? '')).toContain('html');
  });
});
