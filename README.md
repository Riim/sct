SCT
===

Simple and fastest javascript template engine.

### Syntax

`{{ a.b.c }}` - escaped output  
`{{{ a.b.c }}}` - unescaped output

`{{? a.b.c }}` - if  
`{{? !a.b.c }}` - if not  
`{{?? a.b.c }}` - else if  
`{{?? !a.b.c }}` - else if not  
`{{??}}` - else  
`{{/?[ comment ]}}` - end if

`{{? varName = a.b.c }}` - `if` with saving value to variable  
`{{?? varName = a.b.c }}` - `else if` with saving value to variable

`{{~ a.b.c :value[ :key] }}` - for  
`{{/~[ comment ]}}` - end for

`{{@ partialName[ :param1[ :param2[ ...]]] }}` - partial  
`{{/@[ comment ]}}` - end partial

`{{= name[ :param1[ :param2[ ...]]] }}` - call partial or helper  
`{{# name[ :param1[ :param2[ ...]]] }}` - call partial or helper with content  
`{{/#[ comment ]}}` - end call

`{{> 'name' }}` - include

`{{// comment }}` - comment

### Install

`npm install sct --save`

### Usage

```js
var sct = require('sct');

var html = sct.compile('text {{a}} text').render({ a: 123 });

console.log(html);
// => 'text 123 text'
```

##### Usage with webpack

Use [sct-loader](https://www.npmjs.com/package/sct-loader).

### Examples

##### Loops and conditions:
```html
<ul>
{{~users :user }}
    {{? user?.firstName }}
        <li>{{user.firstName}}</li>
    {{?? ln=user?.lastName }}
        <li>{{ln}}</li>
    {{??}}
        <li>No name</li>
    {{/?}}
{{/~}}
</ul>
```

You can add a `?` character in the path expression to check the existence of property:
```html
{{? a.b?()?.c.d?.e }}
    {{a.b.c.d.e}}
{{/?}}
```

##### Partials:
```html
{{@item :name }}
	{{? name }}
	    <li>{{name}}</li>
	{{??}}
	    <li>No name</li>
	{{/?}}
{{/@}}

<ul>
{{~users :user }}
	{{=item user.firstName || user.lastName }}
{{/~}}
</ul>
```

```html
{{@link :content :href }}
    <a href="{{href}}">{{{content}}}</a>
{{/@}}

{{=link 'Click me!', 'http://mediacomm.ru/' }}

{{#link 'http://mediacomm.ru/' }}
    Click me!
{{/#}}
```
