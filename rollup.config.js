const typescript = require('rollup-plugin-typescript2')

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'FinalMem',
      sourcemap: true,
      globals: {
        react: 'React'
      }
    }
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
      useTsconfigDeclarationDir: true
    })
  ],
  external: ['react']
}
