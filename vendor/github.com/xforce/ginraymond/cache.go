package ginraymond

import (
	"sync"

	"github.com/aymerick/raymond"
)

var lock = sync.RWMutex{}

// TemplateCache manages a cache for raymond templates.
type TemplateCache struct {
	TemplateDir string
	cache       map[string]*raymond.Template
}

// LoadTemplate always loads the template from disk.
func LoadTemplate(filename string) (*raymond.Template, error) {
	tpl, err := raymond.ParseFile(filename)
	return tpl, err
}

// MustLoadTemplate loads the template from disk and panics on error.
func MustLoadTemplate(filename string) *raymond.Template {
	tpl, err := raymond.ParseFile(filename)
	if err != nil {
		panic(err)
	}
	return tpl
}

// Get either returns the template from the cache or load it from disk.
func (c *TemplateCache) Get(filename string) (*raymond.Template, error) {
	// First try to get the template from the cache.
	lock.RLock()
	tpl, ok := c.cache[filename]
	lock.RUnlock()

	// If the template is in the cache, return it.
	if ok {
		return tpl, nil
	}

	// Otherwise load template from disk, put it in the cache and return it,
	// but only put it in the cache if there were no errors from LoadTemplate.
	tpl, err := LoadTemplate(filename)
	if err != nil {
		lock.Lock()
		c.cache[filename] = tpl
		lock.Unlock()
	}
	return tpl, err
}

// MustGet either returns the template from the cache or load it from disk.
// On error this does a panic, if you don't want this then use the Get method.
func (c *TemplateCache) MustGet(filename string) *raymond.Template {
	tpl, err := c.Get(filename)
	if err != nil {
		panic(err)
	}
	return tpl
}
