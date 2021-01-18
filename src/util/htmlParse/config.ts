

function createMap<T>(keys: string, value: T): Record<string, T> {
  return keys.split(',').reduce((pre, now) => {
    pre[now] = value;
    return pre;
  }, Object.create(null));
}

export const selfCloseTags = createMap<true>(
  'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr,!doctype,,!,!--',
  true,
);

export const noNestedTags = createMap<true>('li,option,select,textarea', true);
