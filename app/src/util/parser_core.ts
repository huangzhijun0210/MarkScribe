import type { TokenList } from '@/types/AST_type'

type State = { src: string; env?: Record<string, unknown>; tokens: TokenList };


//这里是构建AST的地方
class Core {
    process(state: State) {
        state.tokens = [ ];
    }
}

//将AST处理成一个个token传回
export function parseToTokens(src: string, env?: any): TokenList {
    const state: State = { src, env, tokens: [] };
    new Core().process(state);
    return state.tokens;
}
