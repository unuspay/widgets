import nodePolyfills from 'rollup-plugin-polyfill-node'
import pkg from './package.json'
import replace from '@rollup/plugin-replace'
import commonjs from  '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve';
import rollup from './rollup.module.config.js'
import { terser } from "rollup-plugin-terser";

export default Object.assign({}, rollup, {
  external: [], // no externals, bundle everything!
  output: [
    {
      format: 'es',
      file: 'dist/esm/index.bundle.js'
    },
    {
      format: 'umd',
      name: pkg.moduleName,
      file: 'dist/umd/index.bundle.js'
    }
  ],
  context: 'window',
  plugins: [...rollup.plugins,
  
    nodePolyfills(),
    terser()
  ]
})
