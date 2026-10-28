/** Static Tailwind 3 build from the user-approved HTML. No runtime CDN or eval. */
module.exports={
  darkMode:'class',
  content:['./site/reference-input.html','./site/src/design.mjs'],
  theme:{extend:{
    colors:{
      obsidian:'#030406',charcoal:'#080B10',panel:'#0C1017',
      gold:{DEFAULT:'#D4AF37',light:'#F7E7B4',bright:'#FFE89E'},
      emerald:{DEFAULT:'#10B981',bright:'#34D399'},
      cyan:{DEFAULT:'#06B6D4',bright:'#22D3EE'}
    },
    fontFamily:{
      serif:['"Instrument Serif"','Georgia','serif'],
      sans:['"Plus Jakarta Sans"','"Vazirmatn"','system-ui','sans-serif'],
      mono:['"JetBrains Mono"','monospace']
    }
  }},
  plugins:[]
};
