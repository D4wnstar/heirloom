import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { dumpLiteralValues } from './utils'
import type { Plugin } from 'unified'

// NOTE: remark-wikilinks #Section links need to abide by whatever id
// formatting we decide here

/**
 * Remark plugin to add ids to HTML headings based on their original
 * markdown content.
 */
const remarkHeadingIds: Plugin<[], Root> = function () {
    return function (tree: Root) {
        visit(tree, 'heading', (node) => {
            const value = dumpLiteralValues(node)
            if (!node.data) {
                node.data = { hProperties: { id: value } }
            } else if (!node.data.hProperties) {
                node.data.hProperties = { id: value }
            } else {
                node.data.hProperties.id = value
            }
        })
    }
}

export default remarkHeadingIds
