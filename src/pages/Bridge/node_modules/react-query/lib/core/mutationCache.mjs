import { notifyManager } from "./notifyManager.mjs";
import { Mutation } from "./mutation.mjs";
import { matchMutation, noop } from "./utils.mjs";
import { Subscribable } from "./subscribable.mjs"; // TYPES

// CLASS
export class MutationCache extends Subscribable {
  constructor(config) {
    super();
    this.config = config || {};
    this.mutations = [];
    this.mutationId = 0;
  }

  build(client, options, state) {
    const mutation = new Mutation({
      mutationCache: this,
      logger: client.getLogger(),
      mutationId: ++this.mutationId,
      options: client.defaultMutationOptions(options),
      state,
      defaultOptions: options.mutationKey ? client.getMutationDefaults(options.mutationKey) : undefined,
      meta: options.meta
    });
    this.add(mutation);
    return mutation;
  }

  add(mutation) {
    this.mutations.push(mutation);
    this.notify({
      type: 'added',
      mutation
    });
  }

  remove(mutation) {
    this.mutations = this.mutations.filter(x => x !== mutation);
    this.notify({
      type: 'removed',
      mutation
    });
  }

  clear() {
    notifyManager.batch(() => {
      this.mutations.forEach(mutation => {
        this.remove(mutation);
      });
    });
  }

  getAll() {
    return this.mutations;
  }

  find(filters) {
    if (typeof filters.exact === 'undefined') {
      filters.exact = true;
    }

    return this.mutations.find(mutation => matchMutation(filters, mutation));
  }

  findAll(filters) {
    return this.mutations.filter(mutation => matchMutation(filters, mutation));
  }

  notify(event) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(event);
      });
    });
  }

  resumePausedMutations() {
    const pausedMutations = this.mutations.filter(x => x.state.isPaused);
    return notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(noop)), Promise.resolve()));
  }

}