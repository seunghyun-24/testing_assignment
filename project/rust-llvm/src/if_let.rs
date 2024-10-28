pub fn func_if_let (optional_value: Option<i32>) -> i32 {

    if let Some(value) = optional_value {
        return value;
    } else {
        return 0;
    }

}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_some() {
        assert_eq!(func_if_let(Some(10)), 10);
    }

    #[test]
    fn test_none() {
        assert_eq!(func_if_let(None), 0);
    }
}
