<?php
/**
 * Plugin Name: Orvexo Storefront Footer
 * Description: Restores Appearance → Menus on this block theme and exposes /wp-json/orvexo/v1/footer and /wp-json/orvexo/v1/theme for the Next.js storefront.
 * Version: 1.3.0
 * Author: Orvexo
 */

if (!defined('ABSPATH')) {
    exit;
}

function orvexo_footer_menu_slugs()
{
    return array(
        'footer-discover' => __('Footer: Discover', 'orvexo-storefront'),
        'footer-customer-care' => __('Footer: Customer Care', 'orvexo-storefront'),
        'footer-trust' => __('Footer: Trust & Transparency', 'orvexo-storefront'),
    );
}

add_action('after_setup_theme', function () {
    register_nav_menus(orvexo_footer_menu_slugs());
});

add_action('rest_api_init', function () {
    register_rest_route(
        'orvexo/v1',
        '/footer',
        array(
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => 'orvexo_footer_rest_payload',
        )
    );
    register_rest_route(
        'orvexo/v1',
        '/theme',
        array(
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => 'orvexo_theme_rest_payload',
        )
    );
});

function orvexo_links_from_menu($menu_id)
{
    $menu_id = (int) $menu_id;
    if ($menu_id <= 0) {
        return array();
    }

    $items = wp_get_nav_menu_items(
        $menu_id,
        array(
            'post_status' => 'publish',
        )
    );
    if (!$items) {
        $raw_ids = get_objects_in_term($menu_id, 'nav_menu');
        $items = array();
        if (!is_wp_error($raw_ids) && $raw_ids) {
            foreach ($raw_ids as $item_id) {
                $post = get_post((int) $item_id);
                if (!$post) {
                    continue;
                }
                $url = get_post_meta($post->ID, '_menu_item_url', true);
                $object_id = (int) get_post_meta($post->ID, '_menu_item_object_id', true);
                if (!$url && $object_id) {
                    $url = get_permalink($object_id);
                }
                $items[] = (object) array(
                    'title' => $post->post_title,
                    'url' => $url,
                    'menu_item_parent' => get_post_meta($post->ID, '_menu_item_menu_item_parent', true),
                );
            }
        }
    }

    $links = array();
    if (!is_array($items)) {
        return $links;
    }
    foreach ($items as $item) {
        $label = wp_strip_all_tags((string) ($item->title ?? ''));
        $href = trim((string) ($item->url ?? ''));
        if ($label === '' || $href === '') {
            continue;
        }
        $links[] = array(
            'label' => $label,
            'href' => $href,
        );
    }
    return $links;
}

function orvexo_links_from_navigation_html($html)
{
    $links = array();
    if (!is_string($html) || $html === '') {
        return $links;
    }
    if (preg_match_all('/<a\s[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is', $html, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $label = wp_strip_all_tags($match[2]);
            $href = trim(html_entity_decode($match[1]));
            if ($label === '' || $href === '') {
                continue;
            }
            $links[] = array(
                'label' => $label,
                'href' => $href,
            );
        }
    }
    return $links;
}

function orvexo_footer_rest_payload()
{
    $locations = get_nav_menu_locations();
    $defaults = array(
        'footer-discover' => sprintf(
            __('Discover %s', 'orvexo-storefront'),
            get_bloginfo('name')
        ),
        'footer-customer-care' => 'Customer Care',
        'footer-trust' => 'Trust & Transparency',
    );

    $columns = array();
    foreach ($defaults as $slug => $fallback_title) {
        $menu_id = isset($locations[$slug]) ? (int) $locations[$slug] : 0;
        $menu = $menu_id ? wp_get_nav_menu_object($menu_id) : false;
        $links = orvexo_links_from_menu($menu_id);
        $columns[] = array(
            'slug' => $slug,
            'title' => ($menu && !empty($menu->name)) ? $menu->name : $fallback_title,
            'links' => $links,
        );
    }

    $extras = array();
    foreach (wp_get_nav_menus() as $menu) {
        $links = orvexo_links_from_menu($menu->term_id);
        if (!$links) {
            continue;
        }
        $extras[] = array(
            'slug' => $menu->slug,
            'title' => $menu->name,
            'links' => $links,
        );
    }

    foreach ($columns as $index => $column) {
        if (!empty($column['links']) || empty($extras[$index])) {
            continue;
        }
        $columns[$index]['title'] = $extras[$index]['title'];
        $columns[$index]['links'] = $extras[$index]['links'];
    }

    $navs = get_posts(
        array(
            'post_type' => 'wp_navigation',
            'post_status' => 'publish',
            'numberposts' => 20,
        )
    );
    foreach ($navs as $nav) {
        $links = orvexo_links_from_navigation_html($nav->post_content);
        if (!$links) {
            continue;
        }
        $hay = strtolower($nav->post_name . ' ' . $nav->post_title);
        $slot = null;
        if (strpos($hay, 'discover') !== false) {
            $slot = 0;
        } elseif (strpos($hay, 'care') !== false || strpos($hay, 'customer') !== false) {
            $slot = 1;
        } elseif (strpos($hay, 'trust') !== false || strpos($hay, 'legal') !== false) {
            $slot = 2;
        }
        if ($slot === null) {
            continue;
        }
        if (empty($columns[$slot]['links'])) {
            $columns[$slot]['title'] = $nav->post_title ?: $columns[$slot]['title'];
            $columns[$slot]['links'] = $links;
        }
    }

    $response = rest_ensure_response(array('columns' => $columns));
    $response->header('Cache-Control', 'no-store');
    return $response;
}

function orvexo_font_families()
{
    $settings = function_exists('wp_get_global_settings')
        ? wp_get_global_settings()
        : array();
    $groups = $settings['typography']['fontFamilies'] ?? array();
    $out = array();
    if (!is_array($groups)) {
        return $out;
    }
    foreach (array('theme', 'custom', 'default') as $origin) {
        if (!empty($groups[$origin]) && is_array($groups[$origin])) {
            $out = array_merge($out, $groups[$origin]);
        }
    }
    if (!$out && isset($groups[0])) {
        $out = $groups;
    }
    return $out;
}

function orvexo_font_name($raw, $families)
{
    $value = is_string($raw) ? trim($raw) : '';
    if ($value === '') {
        return '';
    }
    if (preg_match('/font-family\|([a-z0-9-]+)/i', $value, $match)) {
        $slug = strtolower($match[1]);
        foreach ($families as $family) {
            if (strtolower((string) ($family['slug'] ?? '')) === $slug) {
                $named = $family['name'] ?? $family['fontFamily'] ?? '';
                return orvexo_first_family_name((string) $named);
            }
        }
        return ucwords(str_replace('-', ' ', $slug));
    }
    return orvexo_first_family_name($value);
}

function orvexo_first_family_name($value)
{
    $clean = trim($value, " \t\n\r\0\x0B\"'");
    $first = trim(explode(',', $clean)[0], " \t\n\r\0\x0B\"'");
    $first = preg_replace('/^var\(--wp--preset--font-family--(.+)\)$/', '$1', $first);
    return trim(str_replace(array('-', '_'), ' ', (string) $first));
}

function orvexo_theme_rest_payload()
{
    $families = orvexo_font_families();
    $styles = function_exists('wp_get_global_styles') ? wp_get_global_styles() : array();
    $body = orvexo_font_name($styles['typography']['fontFamily'] ?? '', $families);
    $heading = orvexo_font_name(
        $styles['elements']['heading']['typography']['fontFamily'] ?? '',
        $families
    );
    if ($heading === '') {
        $heading = $body;
    }

    return rest_ensure_response(
        array(
            'font' => $body,
            'fontDisplay' => $heading,
        )
    );
}
